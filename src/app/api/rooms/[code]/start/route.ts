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
    const cookieStore = await cookies();
    const member = await findRoomMember(admin, code, cookieStore.get(roomSessionCookieName(code))?.value);
    if (!member) return errorResponse("참가 정보를 찾을 수 없어요.", 401);

    const { data: room, error: roomError } = await admin.from("rooms").select("host_player_id, status").eq("code", code).maybeSingle();
    if (roomError) throw roomError;
    if (!room) return errorResponse("존재하지 않는 방이에요.", 404);
    if (room.host_player_id !== member.id) return errorResponse("방장만 게임을 시작할 수 있어요.", 403);
    if (room.status !== "waiting") return errorResponse("이미 게임이 시작됐어요.", 409);

    const { count, error: countError } = await admin.from("players").select("id", { count: "exact", head: true }).eq("room_code", code);
    if (countError) throw countError;
    if ((count ?? 0) < 2) return errorResponse("게임을 시작하려면 최소 2명이 필요해요.", 409);

    const { error: updateError } = await admin.from("rooms").update({ status: "playing" }).eq("code", code).eq("status", "waiting");
    if (updateError) throw updateError;
    return Response.json({ status: "playing" });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
