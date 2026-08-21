import { cookies } from "next/headers";
import { databaseErrorResponse, errorResponse } from "@/lib/api-response";
import { validateGameSettings } from "@/lib/game";
import { findRoomMember, roomCodeFromPath } from "@/lib/room-server";
import { roomSessionCookieName } from "@/lib/room-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, context: { params: Promise<{ code: string }> }) {
  const code = roomCodeFromPath((await context.params).code);
  if (!code) return errorResponse("방 코드 형식이 올바르지 않아요.", 400);
  try {
    const admin = createAdminClient();
    const member = await findRoomMember(admin, code, (await cookies()).get(roomSessionCookieName(code))?.value);
    if (!member) return errorResponse("이 방의 참가 정보를 찾을 수 없어요.", 401);
    const [{ data: room, error: roomError }, { count, error: countError }] = await Promise.all([
      admin.from("rooms").select("host_player_id, status").eq("code", code).maybeSingle(),
      admin.from("players").select("id", { count: "exact", head: true }).eq("room_code", code),
    ]);
    if (roomError || countError) throw roomError ?? countError;
    if (!room) return errorResponse("존재하지 않는 방이에요.", 404);
    if (room.host_player_id !== member.id) return errorResponse("방장만 게임 설정을 바꿀 수 있어요.", 403);
    if (room.status !== "waiting") return errorResponse("게임이 시작된 뒤에는 설정을 바꿀 수 없어요.", 409);
    const parsed = validateGameSettings(await request.json().catch(() => null), count ?? 0);
    if (!parsed.value) return errorResponse(parsed.error ?? "게임 설정을 확인해 주세요.", 400);
    const { maxPlayers, roundSeconds, revealMode } = parsed.value;
    const { data, error } = await admin.from("rooms").update({ max_players: maxPlayers, round_seconds: roundSeconds, reveal_mode: revealMode }).eq("code", code).eq("status", "waiting").select("max_players, round_seconds, reveal_mode").single();
    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
