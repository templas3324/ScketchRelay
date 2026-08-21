import type { RevealMode } from "@/types/game";

export const ROUND_SECONDS = [60, 90, 120] as const;

export function validateGameSettings(input: unknown, currentPlayers: number) {
  if (!input || typeof input !== "object") return { error: "게임 설정을 확인해 주세요." } as const;
  const value = input as Record<string, unknown>;
  const maxPlayers = Number(value.maxPlayers);
  const roundSeconds = Number(value.roundSeconds);
  const revealMode = value.revealMode as RevealMode;

  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 8) return { error: "최대 인원은 2~8명으로 설정해 주세요." } as const;
  if (maxPlayers < currentPlayers) return { error: "최대 인원은 현재 참가자 수보다 작을 수 없어요." } as const;
  if (!ROUND_SECONDS.includes(roundSeconds as (typeof ROUND_SECONDS)[number])) return { error: "라운드 시간은 60초, 90초, 120초 중에서 선택해 주세요." } as const;
  if (revealMode !== "host_controlled" && revealMode !== "automatic") return { error: "공개 방식을 확인해 주세요." } as const;
  return { value: { maxPlayers, roundSeconds, revealMode } } as const;
}

export function validateFirstSentence(input: unknown) {
  if (!input || typeof input !== "object") return { error: "첫 문장을 입력해 주세요." } as const;
  const content = String((input as Record<string, unknown>).content ?? "").trim();
  if (content.length < 1 || content.length > 120) return { error: "첫 문장은 1~120자로 입력해 주세요." } as const;
  return { value: content } as const;
}
