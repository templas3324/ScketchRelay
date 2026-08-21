"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { GameGuideButton } from "@/components/game/game-guide-button";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/status-message";
import { getBrowserClient } from "@/lib/supabase/browser";
import { useRoomHeartbeat } from "@/lib/use-room-heartbeat";
import type { ResultsSnapshot } from "@/types/game";

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? fallback;
}

export function ResultsView({ code }: { code: string }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<ResultsSnapshot | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const refresh = useCallback(async () => {
    const response = await fetch(`/api/rooms/${code}/results`, { cache: "no-store" });
    if (!response.ok) throw new Error(await readError(response, "결과를 불러오지 못했어요."));
    setSnapshot(await response.json() as ResultsSnapshot);
  }, [code]);
  useRoomHeartbeat(code, refresh);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    async function connect() {
      try {
        await refresh();
        const supabase = getBrowserClient();
        if (!supabase) return;
        channel = supabase.channel(`room:${code}`);
        const handleChange = () => void refresh().catch(() => setMessage("공개 상태를 갱신하지 못했어요."));
        channel.on("broadcast", { event: "UPDATE" }, handleChange).subscribe();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "결과를 불러오지 못했어요.");
      }
    }
    void connect();
    return () => { if (channel) void channel.unsubscribe(); };
  }, [code, refresh]);

  async function revealNext() {
    setIsPending(true);
    const response = await fetch(`/api/rooms/${code}/results/reveal`, { method: "POST" });
    if (!response.ok) setMessage(await readError(response, "다음 결과를 공개하지 못했어요."));
    else { setMessage(""); await refresh(); }
    setIsPending(false);
  }

  async function leaveResults() {
    const response = await fetch(`/api/rooms/${code}`, { method: "DELETE" });
    if (!response.ok) setMessage(await readError(response, "방에서 나가지 못했어요."));
    else router.push("/");
  }

  if (!snapshot) return <main className="grid min-h-screen place-items-center bg-[#fff8e8]"><div className="text-center font-black">결과를 준비하는 중...{message && <p className="mt-2">{message}</p>}</div></main>;
  const allRevealed = snapshot.revealedCount >= snapshot.totalRelays;
  return <main className="min-h-screen bg-[#fff8e8] px-5 py-8 text-[#272334]"><div className="mx-auto max-w-4xl"><header className="flex items-center justify-between gap-3"><Link href="/" className="text-xl font-black">✏️ Scketch Relay</Link><div className="flex gap-2"><GameGuideButton /><button type="button" onClick={leaveResults} className="rounded-full px-3 py-1.5 text-sm font-black text-[#71697b] hover:bg-white">나가기</button></div></header><section className="mt-10 text-center"><p className="text-5xl">🎉</p><h1 className="mt-3 text-4xl font-black">우리의 엉뚱한 릴레이</h1><p className="mt-3 font-bold text-[#71697b]">{snapshot.revealedCount} / {snapshot.totalRelays}개 공개</p></section>
    {snapshot.relays.length === 0 ? <section className="mt-8 rounded-[28px] border-[3px] border-[#272334] bg-white p-8 text-center shadow-[7px_8px_0_#272334]"><p className="text-4xl">🥁</p><h2 className="mt-3 text-2xl font-black">첫 번째 결과를 기다리고 있어요</h2><p className="mt-2 font-semibold text-[#71697b]">방장이 공개 버튼을 누르면 모두에게 동시에 보여요.</p></section> : <div className="mt-8 grid gap-8">{snapshot.relays.map((relay, relayIndex) => <article key={relay.id} className="rounded-[28px] border-[3px] border-[#272334] bg-white p-5 shadow-[7px_8px_0_#272334] sm:p-8"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-[#ffe17b] text-xl font-black">{relayIndex + 1}</span><div><p className="text-sm font-black text-[#ff6b4a]">RELAY STORY</p><h2 className="text-2xl font-black">{relay.starterNickname}에서 시작된 이야기</h2></div></div><ol className="mt-6 grid gap-4">{relay.submissions.map((submission) => <li key={submission.id} className="rounded-2xl border-2 border-[#ded8e1] bg-[#fffcf7] p-4 sm:p-5"><div className="flex justify-between text-xs font-black text-[#71697b]"><span>ROUND {submission.round}</span><span>{submission.authorNickname}</span></div>{submission.kind === "drawing" ? <div className="mt-3 overflow-hidden rounded-xl border-2 border-[#272334] bg-white"><Image src={submission.content} alt={`${submission.authorNickname}의 그림`} width={800} height={500} unoptimized className="aspect-[8/5] w-full object-contain" /></div> : <p className="mt-3 text-center text-xl font-black">“{submission.content}”</p>}</li>)}</ol></article>)}</div>}
    {message && <StatusMessage>{message}</StatusMessage>}
    <div className="sticky bottom-4 mt-8 rounded-2xl border-2 border-[#272334] bg-white/95 p-3 shadow-[4px_5px_0_#272334] backdrop-blur">{snapshot.isHost && !allRevealed && snapshot.revealMode === "host_controlled" ? <Button onClick={revealNext} disabled={isPending} size="large" className="w-full">{snapshot.revealedCount === 0 ? "첫 결과 공개하기" : "다음 결과 공개하기"}</Button> : !allRevealed ? <p className="py-3 text-center font-black text-[#6548bd]">방장이 다음 결과를 공개할 때까지 기다려 주세요</p> : <Link href="/" className="block rounded-2xl bg-[#7f62d9] px-5 py-4 text-center text-lg font-black text-white">홈으로 돌아가기</Link>}</div>
  </div></main>;
}
