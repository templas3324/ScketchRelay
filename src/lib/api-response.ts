export function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function databaseErrorResponse(error: unknown) {
  console.error("Database request failed:", JSON.stringify(error));
  return errorResponse("서버 연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.", 500);
}
