import assert from "node:assert/strict";
import test from "node:test";
import { validateChatMessage } from "../src/lib/chat.ts";
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
