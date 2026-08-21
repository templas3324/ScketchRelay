import { cookies } from "next/headers";
import { databaseErrorResponse, errorResponse } from "@/lib/api-response";
import { findAssignedRelay } from "@/lib/game-server";
import { playerConnectionStatus } from "@/lib/game";
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
    // 별도 스케줄러 없이도 활성 참가자의 조회를 기점으로 만료된 라운드를 원자적으로 마감한다.
    const { error: expireError } = await admin.rpc("expire_game_round", { target_room_code: code });
    if (expireError) throw expireError;
    const { error: departedError } = await admin.rpc("fill_departed_player_turns", { target_room_code: code });
    if (departedError) throw departedError;
    const [{ data: game, error: gameError }, { data: room, error: roomError }] = await Promise.all([
      admin.from("games").select("id, room_code, phase, current_round, total_rounds, deadline").eq("room_code", code).maybeSingle(),
      admin.from("rooms").select("status, host_player_id").eq("code", code).maybeSingle(),
    ]);
    if (gameError || roomError) throw gameError ?? roomError;
    if (!game || !room) return errorResponse("시작된 게임을 찾을 수 없어요.", 404);
    const relay = await findAssignedRelay(admin, game.id, code, member.id, game.current_round);
    if (!relay) return errorResponse("배정된 릴레이를 찾을 수 없어요.", 404);
    const [{ count: submittedCount, error: submittedError }, { data: players, count: playerCount, error: playerError }, { data: own, error: ownError }, promptResult] = await Promise.all([
      admin.from("submissions").select("id", { count: "exact", head: true }).eq("game_id", game.id).eq("round", game.current_round),
      admin.from("players").select("id, nickname, last_seen_at, left_at", { count: "exact" }).eq("room_code", code).order("joined_at"),
      admin.from("submissions").select("id").eq("game_id", game.id).eq("author_player_id", member.id).eq("round", game.current_round).maybeSingle(),
      game.current_round > 1 ? admin.from("submissions").select("kind, content").eq("relay_id", relay.id).eq("round", game.current_round - 1).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    if (submittedError || playerError || ownError || promptResult.error) throw submittedError ?? playerError ?? ownError ?? promptResult.error;
    const playerStatuses = (players ?? []).map((player) => ({ id: player.id, nickname: player.nickname, status: playerConnectionStatus(player.last_seen_at, player.left_at) }));
    return Response.json({ game: { id: game.id, roomCode: game.room_code, phase: game.phase, round: game.current_round, totalRounds: game.total_rounds, deadline: game.deadline }, currentPlayerId: member.id, submitted: Boolean(own), submittedCount: submittedCount ?? 0, playerCount: playerCount ?? 0, roomStatus: room.status, prompt: promptResult.data, hostPlayerId: room.host_player_id, players: playerStatuses });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
