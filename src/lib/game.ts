import type { PromptMode, RevealMode } from "@/types/game";

export const ROUND_SECONDS = [60, 90, 120] as const;

export function validateGameSettings(input: unknown, currentPlayers: number) {
  if (!input || typeof input !== "object") return { error: "게임 설정을 확인해 주세요." } as const;
  const value = input as Record<string, unknown>;
  const maxPlayers = Number(value.maxPlayers);
  const roundSeconds = Number(value.roundSeconds);
  const revealMode = value.revealMode as RevealMode;
  const promptMode = value.promptMode as PromptMode;

  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 8) return { error: "최대 인원은 2~8명으로 설정해 주세요." } as const;
  if (maxPlayers < currentPlayers) return { error: "최대 인원은 현재 참가자 수보다 작을 수 없어요." } as const;
  if (!ROUND_SECONDS.includes(roundSeconds as (typeof ROUND_SECONDS)[number])) return { error: "라운드 시간은 60초, 90초, 120초 중에서 선택해 주세요." } as const;
  if (revealMode !== "host_controlled" && revealMode !== "automatic") return { error: "공개 방식을 확인해 주세요." } as const;
  if (promptMode !== "free" && promptMode !== "random") return { error: "시작 방식을 확인해 주세요." } as const;
  return { value: { maxPlayers, roundSeconds, revealMode, promptMode } } as const;
}

export function validateFirstSentence(input: unknown) {
  if (!input || typeof input !== "object") return { error: "첫 문장을 입력해 주세요." } as const;
  const content = String((input as Record<string, unknown>).content ?? "").trim();
  if (content.length < 1 || content.length > 120) return { error: "첫 문장은 1~120자로 입력해 주세요." } as const;
  return { value: content } as const;
}

export function assignedStarterIndex(playerIndex: number, round: number, playerCount: number) {
  if (playerCount < 1) return -1;
  // 라운드마다 릴레이를 한 칸씩 넘겨 모든 참가자가 자기 결과가 아닌 다음 결과를 작성한다.
  return (playerIndex - (round - 1) + playerCount) % playerCount;
}

export function validateDrawing(input: unknown) {
  if (!input || typeof input !== "object") return { error: "그림을 확인해 주세요." } as const;
  const content = String((input as Record<string, unknown>).content ?? "");
  if (!/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/=]+$/.test(content)) return { error: "PNG 형식의 그림만 제출할 수 있어요." } as const;
  if (content.length > 1_000_000) return { error: "그림 데이터가 너무 커요. 선을 조금 단순하게 그려 주세요." } as const;
  return { value: content } as const;
}

export function playerConnectionStatus(lastSeenAt: string, leftAt: string | null, now = Date.now()) {
  if (leftAt) return "left" as const;
  return new Date(lastSeenAt).getTime() >= now - 30_000 ? "online" as const : "offline" as const;
}
