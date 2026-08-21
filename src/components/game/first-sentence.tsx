"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/status-message";
import { getBrowserClient } from "@/lib/supabase/browser";
import type { GameSnapshot } from "@/types/game";

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? fallback;
}

export function FirstSentence({ code }: { code: string }) {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/rooms/${code}/game`, { cache: "no-store" });
    if (!response.ok) throw new Error(await readError(response, "게임 정보를 불러오지 못했어요."));
    setSnapshot(await response.json() as GameSnapshot);
  }, [code]);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    async function connect() {
      try {
        await refresh();
        const supabase = getBrowserClient();
        if (!supabase) return;
        channel = supabase.channel(`room:${code}`);
        const handleChange = () => void refresh().catch(() => setMessage("제출 현황을 갱신하지 못했어요."));
        channel.on("broadcast", { event: "INSERT" }, handleChange).on("broadcast", { event: "UPDATE" }, handleChange).subscribe();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "게임 정보를 불러오지 못했어요.");
      }
    }
    void connect();
    return () => { if (channel) void channel.unsubscribe(); };
  }, [code, refresh]);

  useEffect(() => {
    if (!snapshot?.game.deadline) return;
    // 서버가 정한 마감 시각을 기준으로 계산해 브라우저마다 동일한 남은 시간을 보여 준다.
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((new Date(snapshot.game.deadline!).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [snapshot?.game.deadline]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    const response = await fetch(`/api/rooms/${code}/game/submissions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
    if (!response.ok) setMessage(await readError(response, "첫 문장을 제출하지 못했어요."));
    else { setContent(""); setMessage("첫 문장을 제출했어요!"); await refresh(); }
    setIsPending(false);
  }

  if (!snapshot) return <main className="grid min-h-screen place-items-center bg-[#fff8e8]"><p className="font-black">게임을 준비하는 중...</p>{message && <p>{message}</p>}</main>;
  return <main className="min-h-screen bg-[#fff8e8] px-5 py-8 text-[#272334]"><div className="mx-auto max-w-2xl"><header className="flex items-center justify-between"><Link href="/" className="text-xl font-black">✏️ Scketch Relay</Link><span className="rounded-full bg-[#ffe17b] px-3 py-1 font-black">{secondsLeft}초</span></header><section className="mt-10 rounded-[32px] border-[3px] border-[#272334] bg-white p-6 text-center shadow-[9px_10px_0_#272334] sm:p-10"><p className="text-sm font-black text-[#7f62d9]">ROUND 1 · 첫 문장</p><h1 className="mt-2 text-3xl font-black">재미있는 상황을 상상해 보세요</h1><p className="mt-3 font-semibold text-[#71697b]">다음 참가자는 이 문장을 그림으로 표현하게 됩니다.</p>{snapshot.submitted ? <div className="mt-8 rounded-2xl bg-[#dff7f2] p-7"><p className="text-4xl">✅</p><p className="mt-3 text-xl font-black">제출 완료!</p><p className="mt-2 font-bold text-[#247865]">{snapshot.submittedCount} / {snapshot.playerCount}명 제출 · 다른 참가자를 기다리고 있어요.</p></div> : <form onSubmit={submit} className="mt-8"><label htmlFor="sentence" className="sr-only">첫 문장</label><textarea id="sentence" value={content} onChange={(event) => setContent(event.target.value)} maxLength={120} disabled={isPending || secondsLeft === 0} placeholder="예: 우주에서 라면을 끓이는 고양이" className="h-36 w-full resize-none rounded-2xl border-2 border-[#d8d1dc] bg-[#fffcf7] p-4 text-lg font-semibold outline-none focus:border-[#7f62d9]"/><div className="mt-2 flex justify-between text-sm font-bold text-[#71697b]"><span>{snapshot.submittedCount} / {snapshot.playerCount}명 제출</span><span>{content.length} / 120</span></div><Button type="submit" size="large" disabled={!content.trim() || isPending || secondsLeft === 0} className="mt-5 w-full">{isPending ? "제출 중..." : "첫 문장 제출하기"}</Button></form>}{message && <StatusMessage>{message}</StatusMessage>}</section></div></main>;
}
