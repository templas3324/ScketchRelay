import { cookies } from "next/headers";
import { databaseErrorResponse, errorResponse } from "@/lib/api-response";
import { validateChatMessage } from "@/lib/chat";
import { findRoomMember, roomCodeFromPath } from "@/lib/room-server";
import { roomSessionCookieName } from "@/lib/room-session";
import { createAdminClient } from "@/lib/supabase/admin";

const CHAT_COOLDOWN_MILLISECONDS = 800;

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const code = roomCodeFromPath((await context.params).code);
  if (!code) return errorResponse("방 코드 형식이 올바르지 않아요.", 400);

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않아요.", 400);
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const validationMessage = validateChatMessage(content);
  if (validationMessage) return errorResponse(validationMessage, 400);

  try {
    const admin = createAdminClient();
    const cookieStore = await cookies();
    const member = await findRoomMember(admin, code, cookieStore.get(roomSessionCookieName(code))?.value);
    if (!member) return errorResponse("채팅을 보내려면 먼저 방에 참가해 주세요.", 401);

    const { data: room, error: roomError } = await admin.from("rooms").select("status").eq("code", code).maybeSingle();
    if (roomError) throw roomError;
    if (!room) return errorResponse("존재하지 않는 방이에요.", 404);
    if (room.status !== "waiting") return errorResponse("게임이 시작되어 채팅이 잠겼어요.", 409);

    // UI 제한은 우회할 수 있으므로 마지막 전송 시각을 서버에서 다시 확인한다.
    const { data: latestMessage, error: latestMessageError } = await admin
      .from("chat_messages")
      .select("created_at")
      .eq("room_code", code)
      .eq("author_player_id", member.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestMessageError) throw latestMessageError;
    if (latestMessage && Date.now() - new Date(latestMessage.created_at).getTime() < CHAT_COOLDOWN_MILLISECONDS) {
      return errorResponse("메시지를 너무 빠르게 보내고 있어요.", 429);
    }

    const { data: message, error: insertError } = await admin
      .from("chat_messages")
      .insert({ room_code: code, author_player_id: member.id, author_nickname: member.nickname, content })
      .select("id, author_player_id, author_nickname, content, created_at")
      .single();
    if (insertError) throw insertError;

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
