import { cookies } from "next/headers";
import { databaseErrorResponse, errorResponse } from "@/lib/api-response";
import { readJsonBody } from "@/lib/api-request";
import { validateDrawing, validateFirstSentence } from "@/lib/game";
import { findAssignedRelay } from "@/lib/game-server";
import { findRoomMember, roomCodeFromPath } from "@/lib/room-server";
import { roomSessionCookieName } from "@/lib/room-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const code = roomCodeFromPath((await context.params).code);
  if (!code) return errorResponse("방 코드 형식이 올바르지 않아요.", 400);
  const parsedBody = await readJsonBody(request, 1_100_000);
  if (!("data" in parsedBody)) return errorResponse(parsedBody.error, parsedBody.status);
  const body = parsedBody.data;
  try {
    const admin = createAdminClient();
    const member = await findRoomMember(admin, code, (await cookies()).get(roomSessionCookieName(code))?.value);
    if (!member) return errorResponse("이 방의 참가 정보를 찾을 수 없어요.", 401);
    const [{ data: game, error: gameError }, { data: room, error: roomError }] = await Promise.all([
      admin.from("games").select("id, phase, current_round, deadline").eq("room_code", code).maybeSingle(),
      admin.from("rooms").select("status").eq("code", code).maybeSingle(),
    ]);
    if (gameError || roomError) throw gameError ?? roomError;
    if (!game || room?.status !== "playing") return errorResponse("지금은 결과를 제출할 수 없어요.", 409);
    if (game.deadline && new Date(game.deadline).getTime() < Date.now()) return errorResponse("이번 라운드 작성 시간이 끝났어요.", 409);

    const parsed = game.phase === "drawing" ? validateDrawing(body) : validateFirstSentence(body);
    if (!parsed.value) return errorResponse(parsed.error ?? "제출 내용을 확인해 주세요.", 400);
    const relay = await findAssignedRelay(admin, game.id, code, member.id, game.current_round);
    if (!relay) return errorResponse("배정된 릴레이를 찾을 수 없어요.", 404);
    const { data, error } = await admin.from("submissions").insert({ game_id: game.id, room_code: code, relay_id: relay.id, author_player_id: member.id, round: game.current_round, kind: game.phase === "drawing" ? "drawing" : "text", content: parsed.value }).select("id, created_at").single();
    if (error?.code === "23505") return errorResponse("이번 라운드 결과는 한 번만 제출할 수 있어요.", 409);
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
