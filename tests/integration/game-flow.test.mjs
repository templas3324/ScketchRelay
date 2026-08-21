import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const DRAWING_A = "data:image/png;base64,iVBORw0KGgoAAAA";
const DRAWING_B = "data:image/png;base64,iVBORw0KGgoBBBB";

class CookieSession {
  #cookies = new Map();

  async request(path, init = {}) {
    const headers = new Headers(init.headers);
    if (this.#cookies.size > 0) headers.set("Cookie", [...this.#cookies].map(([name, value]) => `${name}=${value}`).join("; "));
    const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
    // 브라우저 탭과 같은 독립 세션을 재현하기 위해 응답 쿠키를 세션 인스턴스별로 보관한다.
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(";", 1);
      const separator = pair.indexOf("=");
      if (separator < 1) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (value) this.#cookies.set(name, value);
      else this.#cookies.delete(name);
    }
    return response;
  }
}

async function requestJson(session, path, init, expectedStatus) {
  const response = await session.request(path, init);
  const body = await response.json().catch(() => null);
  assert.equal(response.status, expectedStatus, `${init?.method ?? "GET"} ${path}: ${JSON.stringify(body)}`);
  return body;
}

function jsonBody(value) {
  return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) };
}

async function removeTestRoom(code) {
  if (!code) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("통합 테스트 정리를 위한 Supabase 서버 환경 변수가 필요합니다.");
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  // 중간 단계에서 테스트가 실패해도 cascade 삭제로 생성 데이터 전체를 반드시 정리한다.
  const { error } = await admin.from("rooms").delete().eq("code", code);
  if (error) throw error;
  const { count, error: countError } = await admin.from("rooms").select("code", { count: "exact", head: true }).eq("code", code);
  if (countError) throw countError;
  assert.equal(count, 0, "통합 테스트가 만든 방이 정리되어야 합니다.");
}

test("2인 랜덤 제시어 게임의 생성부터 결과 재시작까지 동작한다", { timeout: 30_000 }, async () => {
  const host = new CookieSession();
  const guest = new CookieSession();
  let code;

  try {
    const created = await requestJson(host, "/api/rooms", { method: "POST", ...jsonBody({ nickname: "자동테스트방장" }) }, 201);
    code = created.code;
    await requestJson(guest, `/api/rooms/${code}/join`, { method: "POST", ...jsonBody({ nickname: "자동테스트참가자" }) }, 200);

    const settings = { maxPlayers: 2, roundSeconds: 120, revealMode: "automatic", promptMode: "random" };
    await requestJson(guest, `/api/rooms/${code}/settings`, { method: "PATCH", ...jsonBody(settings) }, 403);
    const savedSettings = await requestJson(host, `/api/rooms/${code}/settings`, { method: "PATCH", ...jsonBody(settings) }, 200);
    assert.equal(savedSettings.prompt_mode, "random");
    await requestJson(host, `/api/rooms/${code}/start`, { method: "POST" }, 200);

    const hostRound1 = await requestJson(host, `/api/rooms/${code}/game`, undefined, 200);
    const guestRound1 = await requestJson(guest, `/api/rooms/${code}/game`, undefined, 200);
    assert.equal(hostRound1.game.phase, "writing");
    assert.equal(guestRound1.game.phase, "writing");
    assert.notEqual(hostRound1.prompt.content, guestRound1.prompt.content);

    await requestJson(host, `/api/rooms/${code}/game/submissions`, { method: "POST", ...jsonBody({ content: "변조 문장 A" }) }, 201);
    await requestJson(guest, `/api/rooms/${code}/game/submissions`, { method: "POST", ...jsonBody({ content: "변조 문장 B" }) }, 201);

    const hostRound2 = await requestJson(host, `/api/rooms/${code}/game`, undefined, 200);
    const guestRound2 = await requestJson(guest, `/api/rooms/${code}/game`, undefined, 200);
    assert.equal(hostRound2.game.phase, "drawing");
    assert.equal(hostRound2.prompt.content, guestRound1.prompt.content);
    assert.equal(guestRound2.prompt.content, hostRound1.prompt.content);

    await requestJson(host, `/api/rooms/${code}/game/submissions`, { method: "POST", ...jsonBody({ content: DRAWING_A }) }, 201);
    await requestJson(guest, `/api/rooms/${code}/game/submissions`, { method: "POST", ...jsonBody({ content: DRAWING_B }) }, 201);

    const results = await requestJson(host, `/api/rooms/${code}/results`, undefined, 200);
    assert.equal(results.roomStatus, "finished");
    assert.equal(results.relays.length, 2);
    const firstTexts = results.relays.map((relay) => relay.submissions[0].content);
    assert.deepEqual(new Set(firstTexts), new Set([hostRound1.prompt.content, guestRound1.prompt.content]));
    assert.equal(firstTexts.includes("변조 문장 A") || firstTexts.includes("변조 문장 B"), false);

    await requestJson(guest, `/api/rooms/${code}/results/restart`, { method: "POST" }, 403);
    const restarted = await requestJson(host, `/api/rooms/${code}/results/restart`, { method: "POST" }, 200);
    assert.deepEqual(restarted, { status: "waiting", playerCount: 2 });
    const lobby = await requestJson(guest, `/api/rooms/${code}`, undefined, 200);
    assert.equal(lobby.room.status, "waiting");
    assert.equal(lobby.players.length, 2);
  } finally {
    await removeTestRoom(code);
  }
});
