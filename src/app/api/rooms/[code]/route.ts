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
    const cookieStore = await cookies();
    const member = await findRoomMember(admin, code, cookieStore.get(roomSessionCookieName(code))?.value);
    if (!member) return errorResponse("이 방의 참가 정보를 찾을 수 없어요.", 401);

    const [
      { data: room, error: roomError },
      { data: players, error: playersError },
      { data: recentMessages, error: messagesError },
    ] = await Promise.all([
      admin.from("rooms").select("code, status, host_player_id, max_players, round_seconds, reveal_mode, prompt_mode, created_at").eq("code", code).maybeSingle(),
      admin.from("players").select("id, nickname, joined_at").eq("room_code", code).order("joined_at"),
      // 최신 50개만 읽은 뒤 응답에서는 오래된 메시지부터 보이도록 순서를 뒤집는다.
      admin.from("chat_messages").select("id, author_player_id, author_nickname, content, created_at").eq("room_code", code).order("created_at", { ascending: false }).limit(50),
    ]);

    if (roomError || playersError || messagesError) throw roomError ?? playersError ?? messagesError;
    if (!room) return errorResponse("존재하지 않는 방이에요.", 404);

    return Response.json({ room, players: players ?? [], messages: (recentMessages ?? []).reverse(), currentPlayerId: member.id });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ code: string }> }) {
  const code = roomCodeFromPath((await context.params).code);
  if (!code) return errorResponse("방 코드 형식이 올바르지 않아요.", 400);

  try {
    const admin = createAdminClient();
    const cookieStore = await cookies();
    const cookieName = roomSessionCookieName(code);
    const member = await findRoomMember(admin, code, cookieStore.get(cookieName)?.value);
    if (!member) return errorResponse("이미 방에서 나갔거나 참가 정보가 없어요.", 401);

    const { data: room, error: roomError } = await admin.from("rooms").select("host_player_id, status").eq("code", code).single();
    if (roomError) throw roomError;
    if (room.status !== "waiting") {
      const { error: leaveError } = await admin.rpc("mark_player_left", { target_room_code: code, actor_player_id: member.id });
      if (leaveError) throw leaveError;
      cookieStore.delete(cookieName);
      return new Response(null, { status: 204 });
    }

    const { error: deleteError } = await admin.from("players").delete().eq("id", member.id);
    if (deleteError) throw deleteError;

    if (room.host_player_id === member.id) {
      const { data: nextHost, error: nextHostError } = await admin.from("players").select("id").eq("room_code", code).order("joined_at").limit(1).maybeSingle();
      if (nextHostError) throw nextHostError;
      if (nextHost) await admin.from("rooms").update({ host_player_id: nextHost.id }).eq("code", code);
      else await admin.from("rooms").delete().eq("code", code);
    }

    cookieStore.delete(cookieName);
    return new Response(null, { status: 204 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
