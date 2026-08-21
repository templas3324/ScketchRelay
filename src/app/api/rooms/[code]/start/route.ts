import { cookies } from "next/headers";
import { databaseErrorResponse, errorResponse } from "@/lib/api-response";
import { findRoomMember, roomCodeFromPath } from "@/lib/room-server";
import { roomSessionCookieName } from "@/lib/room-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, context: { params: Promise<{ code: string }> }) {
  const code = roomCodeFromPath((await context.params).code);
  if (!code) return errorResponse("방 코드 형식이 올바르지 않아요.", 400);
  try {
    const admin = createAdminClient();
    const member = await findRoomMember(admin, code, (await cookies()).get(roomSessionCookieName(code))?.value);
    if (!member) return errorResponse("이 방의 참가 정보를 찾을 수 없어요.", 401);
    const [{ data: room, error: roomError }, { data: players, error: playersError }] = await Promise.all([
      admin.from("rooms").select("host_player_id, status, round_seconds").eq("code", code).maybeSingle(),
      admin.from("players").select("id").eq("room_code", code).order("joined_at"),
    ]);
    if (roomError || playersError) throw roomError ?? playersError;
    if (!room) return errorResponse("존재하지 않는 방이에요.", 404);
    if (room.host_player_id !== member.id) return errorResponse("방장만 게임을 시작할 수 있어요.", 403);
    if (room.status !== "waiting") return errorResponse("이미 게임이 시작됐어요.", 409);
    if ((players?.length ?? 0) < 2) return errorResponse("게임을 시작하려면 최소 2명이 필요해요.", 409);

    const deadline = new Date(Date.now() + room.round_seconds * 1000).toISOString();
    const { data: game, error: gameError } = await admin.from("games").insert({ room_code: code, total_rounds: players!.length, deadline }).select("id").single();
    if (gameError) throw gameError;
    // 연속된 REST 변경 중 하나가 실패해도 불완전한 게임을 남기지 않도록 보상 삭제한다.
    const { error: relayError } = await admin.from("relays").insert(players!.map((player) => ({ game_id: game.id, room_code: code, starter_player_id: player.id })));
    if (relayError) {
      await admin.from("games").delete().eq("id", game.id);
      throw relayError;
    }
    const { data: updatedRoom, error: updateError } = await admin.from("rooms").update({ status: "playing" }).eq("code", code).eq("status", "waiting").select("code").maybeSingle();
    if (updateError || !updatedRoom) {
      await admin.from("games").delete().eq("id", game.id);
      if (updateError) throw updateError;
      return errorResponse("다른 요청에서 이미 게임을 시작했어요.", 409);
    }
    return Response.json({ status: "playing", gameId: game.id });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
