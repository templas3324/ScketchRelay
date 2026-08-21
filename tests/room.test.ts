import assert from "node:assert/strict";
import test from "node:test";
import { validateChatMessage } from "../src/lib/chat.ts";
import { assignedStarterIndex, validateDrawing, validateFirstSentence, validateGameSettings } from "../src/lib/game.ts";
import { createRoomCode, isValidRoomCode, normalizeRoomCode, validateJoinRequest, validateNickname } from "../src/lib/room.ts";

test("방 코드 입력을 대문자 영숫자 6자리까지 정규화한다", () => {
  assert.equal(normalizeRoomCode("ab-cd!12x"), "ABCD12");
});

test("4~6자리 영문 대문자와 숫자만 유효한 방 코드로 인정한다", () => {
  assert.equal(isValidRoomCode("A2CD"), true);
  assert.equal(isValidRoomCode("ABC123"), true);
  assert.equal(isValidRoomCode("abc12"), false);
  assert.equal(isValidRoomCode("ABC"), false);
});

test("생성된 방 코드는 혼동하기 쉬운 문자를 제외한 5자리 코드다", () => {
  const code = createRoomCode(() => 0);
  assert.equal(code, "AAAAA");
  assert.equal(isValidRoomCode(code), true);
});

test("참가 요청에서 닉네임을 먼저 검증한다", () => {
  assert.equal(validateJoinRequest("  ", "ABCDE"), "먼저 닉네임을 입력해 주세요.");
  assert.equal(validateJoinRequest("릴레이", "ABC"), "방 코드는 영문 대문자와 숫자 4~6자리예요.");
  assert.equal(validateJoinRequest("릴레이", "ABCDE"), null);
});

test("닉네임은 공백이 아니며 12자 이하여야 한다", () => {
  assert.equal(validateNickname("  "), "먼저 닉네임을 입력해 주세요.");
  assert.equal(validateNickname("1234567890123"), "닉네임은 12자 이하로 입력해 주세요.");
  assert.equal(validateNickname("그림왕"), null);
});

test("채팅 메시지는 공백이 아니며 200자 이하여야 한다", () => {
  assert.equal(validateChatMessage("   "), "메시지를 입력해 주세요.");
  assert.equal(validateChatMessage("가".repeat(201)), "메시지는 200자 이하로 입력해 주세요.");
  assert.equal(validateChatMessage("안녕하세요!"), null);
});

test("게임 설정은 허용 범위와 현재 참가자 수를 검증한다", () => {
  assert.equal(validateGameSettings({ maxPlayers: 2, roundSeconds: 90, revealMode: "automatic" }, 3).error, "최대 인원은 현재 참가자 수보다 작을 수 없어요.");
  assert.deepEqual(validateGameSettings({ maxPlayers: 4, roundSeconds: 120, revealMode: "host_controlled" }, 3), { value: { maxPlayers: 4, roundSeconds: 120, revealMode: "host_controlled" } });
});

test("첫 문장은 공백이 아니며 120자 이하여야 한다", () => {
  assert.equal(validateFirstSentence({ content: "  " }).error, "첫 문장은 1~120자로 입력해 주세요.");
  assert.deepEqual(validateFirstSentence({ content: "  하늘을 나는 고래  " }), { value: "하늘을 나는 고래" });
});

test("릴레이는 라운드마다 이전 참가자의 것을 순환 배정한다", () => {
  assert.equal(assignedStarterIndex(0, 1, 3), 0);
  assert.equal(assignedStarterIndex(0, 2, 3), 2);
  assert.equal(assignedStarterIndex(1, 3, 3), 2);
});

test("그림은 크기가 제한된 PNG Data URL만 허용한다", () => {
  assert.equal(validateDrawing({ content: "https://example.com/drawing.png" }).error, "PNG 형식의 그림만 제출할 수 있어요.");
  assert.deepEqual(validateDrawing({ content: "data:image/png;base64,iVBORw0KGgoAAAA" }), { value: "data:image/png;base64,iVBORw0KGgoAAAA" });
});
