import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { databaseErrorResponse, errorResponse } from "@/lib/api-response";
import { readJsonBody } from "@/lib/api-request";
import { validateNickname } from "@/lib/room";
import { roomCodeFromPath } from "@/lib/room-server";
import { createSessionToken, hashSessionToken, roomSessionCookieName } from "@/lib/room-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const code = roomCodeFromPath((await context.params).code);
  if (!code) return errorResponse("방 코드 형식이 올바르지 않아요.", 400);

  const parsedBody = await readJsonBody(request, 2_000);
  if (!("data" in parsedBody)) return errorResponse(parsedBody.error, parsedBody.status);
  const body = parsedBody.data as { nickname?: unknown };

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const validationMessage = validateNickname(nickname);
  if (validationMessage) return errorResponse(validationMessage, 400);

  try {
    const admin = createAdminClient();
    const { data: room, error: roomError } = await admin.from("rooms").select("status").eq("code", code).maybeSingle();
    if (roomError) throw roomError;
    if (!room) return errorResponse("존재하지 않는 방이에요.", 404);
    if (room.status !== "waiting") return errorResponse("이미 게임이 시작된 방이에요.", 409);

    const playerId = randomUUID();
    const token = createSessionToken();
    const { error: playerError } = await admin.from("players").insert({
      id: playerId,
      room_code: code,
      nickname,
      session_token_hash: hashSessionToken(token),
    });

    if (playerError) {
      if (playerError.code === "23505") return errorResponse("이미 사용 중인 닉네임이에요.", 409);
      if (playerError.message.includes("ROOM_FULL")) return errorResponse("방이 가득 찼어요.", 409);
      if (playerError.message.includes("ROOM_ALREADY_STARTED")) return errorResponse("이미 게임이 시작된 방이에요.", 409);
      throw playerError;
    }

    const response = NextResponse.json({ code });
    response.cookies.set(roomSessionCookieName(code), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/",
    });
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
