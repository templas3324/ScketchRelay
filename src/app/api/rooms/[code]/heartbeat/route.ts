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
    const { data: hostPlayerId, error } = await admin.rpc("heartbeat_player", { target_room_code: code, actor_player_id: member.id });
    if (error?.message.includes("PLAYER_NOT_ACTIVE")) return errorResponse("이미 중도 이탈 처리된 참가자예요.", 409);
    if (error) throw error;
    return Response.json({ hostPlayerId });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
