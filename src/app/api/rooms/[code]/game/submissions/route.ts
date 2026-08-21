import { cookies } from "next/headers";
import { databaseErrorResponse, errorResponse } from "@/lib/api-response";
import { validateFirstSentence } from "@/lib/game";
import { findRoomMember, roomCodeFromPath } from "@/lib/room-server";
import { roomSessionCookieName } from "@/lib/room-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const code = roomCodeFromPath((await context.params).code);
  if (!code) return errorResponse("방 코드 형식이 올바르지 않아요.", 400);
  const parsed = validateFirstSentence(await request.json().catch(() => null));
  if (!parsed.value) return errorResponse(parsed.error ?? "첫 문장을 입력해 주세요.", 400);
  try {
    const admin = createAdminClient();
    const member = await findRoomMember(admin, code, (await cookies()).get(roomSessionCookieName(code))?.value);
    if (!member) return errorResponse("이 방의 참가 정보를 찾을 수 없어요.", 401);
    const { data: game, error: gameError } = await admin.from("games").select("id, phase, current_round, deadline").eq("room_code", code).maybeSingle();
    if (gameError) throw gameError;
    if (!game || game.phase !== "writing" || game.current_round !== 1) return errorResponse("지금은 첫 문장을 제출할 수 없어요.", 409);
    if (game.deadline && new Date(game.deadline).getTime() < Date.now()) return errorResponse("첫 문장 작성 시간이 끝났어요.", 409);
    const { data: relay, error: relayError } = await admin.from("relays").select("id").eq("game_id", game.id).eq("starter_player_id", member.id).maybeSingle();
    if (relayError) throw relayError;
    if (!relay) return errorResponse("내 릴레이를 찾을 수 없어요.", 404);
    const { data, error } = await admin.from("submissions").insert({ game_id: game.id, room_code: code, relay_id: relay.id, author_player_id: member.id, round: 1, kind: "text", content: parsed.value }).select("id, created_at").single();
    if (error?.code === "23505") return errorResponse("첫 문장은 한 번만 제출할 수 있어요.", 409);
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
