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
    const { data: room, error: roomError } = await admin.from("rooms").select("host_player_id, status, reveal_mode").eq("code", code).maybeSingle();
    if (roomError) throw roomError;
    if (!room) return errorResponse("존재하지 않는 방이에요.", 404);
    if (room.host_player_id !== member.id) return errorResponse("방장만 다음 결과를 공개할 수 있어요.", 403);
    if (room.status !== "revealing" || room.reveal_mode !== "host_controlled") return errorResponse("지금은 다음 결과를 공개할 수 없어요.", 409);
    const { data, error } = await admin.rpc("reveal_next_relay", { target_room_code: code, actor_player_id: member.id });
    if (error) throw error;
    return Response.json({ revealedCount: data });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
