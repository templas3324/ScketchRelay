const decoder = new TextDecoder();

export async function readJsonBody(request: Request, maxBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) return { error: "요청 데이터가 너무 커요.", status: 413 } as const;
  if (!request.body) return { error: "요청 형식이 올바르지 않아요.", status: 400 } as const;

  const reader = request.body.getReader();
  let totalBytes = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    // Content-Length가 없거나 거짓이어도 스트림을 읽는 중에 상한을 강제해 메모리 고갈을 막는다.
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return { error: "요청 데이터가 너무 커요.", status: 413 } as const;
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try {
    return { data: JSON.parse(text) as unknown } as const;
  } catch {
    return { error: "요청 형식이 올바르지 않아요.", status: 400 } as const;
  }
}
