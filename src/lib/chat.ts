export const MAX_CHAT_MESSAGE_LENGTH = 200;

export function validateChatMessage(value: string): string | null {
  const message = value.trim();
  if (!message) return "메시지를 입력해 주세요.";
  if (message.length > MAX_CHAT_MESSAGE_LENGTH) return `메시지는 ${MAX_CHAT_MESSAGE_LENGTH}자 이하로 입력해 주세요.`;
  return null;
}
