import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { databaseErrorResponse, errorResponse } from "@/lib/api-response";
import { readJsonBody } from "@/lib/api-request";
import { createRoomCode, validateNickname } from "@/lib/room";
import { createSessionToken, hashSessionToken, roomSessionCookieName } from "@/lib/room-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const parsedBody = await readJsonBody(request, 2_000);
  if (!("data" in parsedBody)) return errorResponse(parsedBody.error, parsedBody.status);
  const body = parsedBody.data as { nickname?: unknown };

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const validationMessage = validateNickname(nickname);
  if (validationMessage) return errorResponse(validationMessage, 400);

  try {
    const admin = createAdminClient();
    const playerId = randomUUID();
    const token = createSessionToken();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = createRoomCode();
      const { error: roomError } = await admin.from("rooms").insert({ code, host_player_id: playerId });
      if (roomError?.code === "23505") continue;
      if (roomError) throw roomError;

      const { error: playerError } = await admin.from("players").insert({
        id: playerId,
        room_code: code,
        nickname,
        session_token_hash: hashSessionToken(token),
      });

      if (playerError) {
        await admin.from("rooms").delete().eq("code", code);
        throw playerError;
      }

      const response = NextResponse.json({ code }, { status: 201 });
      response.cookies.set(roomSessionCookieName(code), token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 12,
        path: "/",
      });
      return response;
    }

    return errorResponse("방 코드를 만들지 못했어요. 다시 시도해 주세요.", 503);
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
