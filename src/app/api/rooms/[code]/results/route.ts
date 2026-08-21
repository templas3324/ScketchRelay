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
    const [{ data: room, error: roomError }, { data: game, error: gameError }, { data: players, error: playersError }, { data: relays, error: relaysError }, { data: submissions, error: submissionsError }] = await Promise.all([
      admin.from("rooms").select("status, reveal_mode, host_player_id").eq("code", code).maybeSingle(),
      admin.from("games").select("id, total_rounds, revealed_count").eq("room_code", code).maybeSingle(),
      admin.from("players").select("id, nickname, joined_at").eq("room_code", code).order("joined_at"),
      admin.from("relays").select("id, starter_player_id").eq("room_code", code),
      admin.from("submissions").select("id, relay_id, author_player_id, round, kind, content").eq("room_code", code).order("round"),
    ]);
    if (roomError || gameError || playersError || relaysError || submissionsError) throw roomError ?? gameError ?? playersError ?? relaysError ?? submissionsError;
    if (!room || !game || (room.status !== "revealing" && room.status !== "finished")) return errorResponse("아직 공개할 결과가 없어요.", 409);
    const playerNames = new Map((players ?? []).map((player) => [player.id, player.nickname]));
    const relayByStarter = new Map((relays ?? []).map((relay) => [relay.starter_player_id, relay]));
    const visibleCount = room.reveal_mode === "automatic" ? game.total_rounds : game.revealed_count;
    // 릴레이 순서는 참가 순서와 같게 고정해 모든 화면에서 같은 공개 순서를 보장한다.
    const visibleRelays = (players ?? []).slice(0, visibleCount).flatMap((player) => {
      const relay = relayByStarter.get(player.id);
      if (!relay) return [];
      return [{ id: relay.id, starterNickname: player.nickname, submissions: (submissions ?? []).filter((submission) => submission.relay_id === relay.id).map((submission) => ({ id: submission.id, round: submission.round, kind: submission.kind, content: submission.content, authorNickname: playerNames.get(submission.author_player_id) ?? "알 수 없음" })) }];
    });
    return Response.json({ roomStatus: room.status, revealMode: room.reveal_mode, isHost: room.host_player_id === member.id, revealedCount: visibleCount, totalRelays: game.total_rounds, relays: visibleRelays });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
