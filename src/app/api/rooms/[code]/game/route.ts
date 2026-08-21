import { cookies } from "next/headers";
import { databaseErrorResponse, errorResponse } from "@/lib/api-response";
import { findRoomMember, roomCodeFromPath } from "@/lib/room-server";
import { roomSessionCookieName } from "@/lib/room-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const code = roomCodeFromPath((await context.params).code);
  if (!code) return errorResponse("방 코드 형식이 올바르지 않아요.", 400);
  try {
    const admin = createAdminClient();
    const member = await findRoomMember(admin, code, (await cookies()).get(roomSessionCookieName(code))?.value);
    if (!member) return errorResponse("이 방의 참가 정보를 찾을 수 없어요.", 401);
    const { data: game, error: gameError } = await admin.from("games").select("id, room_code, phase, current_round, total_rounds, deadline").eq("room_code", code).maybeSingle();
    if (gameError) throw gameError;
    if (!game) return errorResponse("시작된 게임을 찾을 수 없어요.", 404);
    const [{ count: submittedCount, error: submittedError }, { count: playerCount, error: playerError }, { data: own, error: ownError }] = await Promise.all([
      admin.from("submissions").select("id", { count: "exact", head: true }).eq("game_id", game.id).eq("round", game.current_round),
      admin.from("players").select("id", { count: "exact", head: true }).eq("room_code", code),
      admin.from("submissions").select("id").eq("game_id", game.id).eq("author_player_id", member.id).eq("round", game.current_round).maybeSingle(),
    ]);
    if (submittedError || playerError || ownError) throw submittedError ?? playerError ?? ownError;
    return Response.json({ game: { id: game.id, roomCode: game.room_code, phase: game.phase, round: game.current_round, totalRounds: game.total_rounds, deadline: game.deadline }, currentPlayerId: member.id, submitted: Boolean(own), submittedCount: submittedCount ?? 0, playerCount: playerCount ?? 0 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
