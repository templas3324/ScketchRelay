const ROOM_CODE_PATTERN = /^[A-Z0-9]{4,6}$/;
const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeRoomCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function isValidRoomCode(value: string): boolean {
  return ROOM_CODE_PATTERN.test(value);
}

export function createRoomCode(random: () => number = Math.random): string {
  return Array.from({ length: 5 }, () => {
    const index = Math.floor(random() * ROOM_CODE_CHARACTERS.length);
    return ROOM_CODE_CHARACTERS[index];
  }).join("");
}

export function validateJoinRequest(nickname: string, roomCode: string): string | null {
  const nicknameMessage = validateNickname(nickname);
  if (nicknameMessage) return nicknameMessage;
  if (!isValidRoomCode(roomCode)) {
    return "방 코드는 영문 대문자와 숫자 4~6자리예요.";
  }
  return null;
}

export function validateNickname(nickname: string): string | null {
  const trimmedNickname = nickname.trim();
  if (!trimmedNickname) return "먼저 닉네임을 입력해 주세요.";
  if (trimmedNickname.length > 12) return "닉네임은 12자 이하로 입력해 주세요.";
  return null;
}