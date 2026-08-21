import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { hashSessionToken } from "@/lib/room-session";

export async function findRoomMember(admin: SupabaseClient, roomCode: string, token: string | undefined) {
  if (!token) return null;

  const { data, error } = await admin
    .from("players")
    .select("id, room_code, nickname, joined_at, session_token_hash")
    .eq("room_code", roomCode)
    .eq("session_token_hash", hashSessionToken(token))
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function roomCodeFromPath(value: string): string | null {
  const code = value.toUpperCase();
  return /^[A-Z0-9]{5}$/.test(code) ? code : null;
}
