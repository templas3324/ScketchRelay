import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { assignedStarterIndex } from "@/lib/game";

export async function findAssignedRelay(admin: SupabaseClient, gameId: string, roomCode: string, playerId: string, round: number) {
  const { data: players, error: playersError } = await admin.from("players").select("id").eq("room_code", roomCode).order("joined_at");
  if (playersError) throw playersError;
  const playerIndex = players?.findIndex((player) => player.id === playerId) ?? -1;
  if (playerIndex < 0 || !players?.length) return null;
  const starter = players[assignedStarterIndex(playerIndex, round, players.length)];
  const { data: relay, error: relayError } = await admin.from("relays").select("id").eq("game_id", gameId).eq("starter_player_id", starter.id).maybeSingle();
  if (relayError) throw relayError;
  return relay;
}
