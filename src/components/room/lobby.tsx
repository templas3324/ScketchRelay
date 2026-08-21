"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/status-message";
import { getBrowserClient } from "@/lib/supabase/browser";
import type { RoomSnapshot } from "@/types/game";

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? fallback;
}

export function Lobby({ code }: { code: string }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [onlinePlayerIds, setOnlinePlayerIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [fatalError, setFatalError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const refreshRoom = useCallback(async () => {
    const response = await fetch(`/api/rooms/${code}`, { cache: "no-store" });
    if (!response.ok) throw new Error(await readError(response, "대기실을 불러오지 못했어요."));
    const nextSnapshot = (await response.json()) as RoomSnapshot;
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }, [code]);

  useEffect(() => {
    let disposed = false;
    let channel: RealtimeChannel | null = null;

    async function connect() {
      try {
        const initial = await refreshRoom();
        if (disposed) return;
        const supabase = getBrowserClient();
        if (!supabase) {
          setMessage("실시간 연결 설정이 없어 참가자 목록을 자동 갱신할 수 없어요.");
          return;
        }

        channel = supabase.channel(`room:${code}`, { config: { presence: { key: initial.currentPlayerId } } });
        const handleChange = () => void refreshRoom().catch(() => setMessage("최신 참가자 정보를 불러오지 못했어요."));
        channel
          .on("broadcast", { event: "INSERT" }, handleChange)
          .on("broadcast", { event: "UPDATE" }, handleChange)
          .on("broadcast", { event: "DELETE" }, handleChange)
          .on("presence", { event: "sync" }, () => {
            if (!channel) return;
            const ids = Object.values(channel.presenceState()).flatMap((entries) =>
              entries.map((entry) => {
                const presence = entry as { playerId?: string; presence_ref?: string };
                return String(presence.playerId ?? presence.presence_ref ?? "");
              }),
            );
            setOnlinePlayerIds(new Set(ids));
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              await channel?.track({ playerId: initial.currentPlayerId, onlineAt: new Date().toISOString() });
            }
          });
      } catch (error) {
        if (!disposed) setFatalError(error instanceof Error ? error.message : "대기실을 불러오지 못했어요.");
      }
    }

    void connect();
    return () => {
      disposed = true;
      if (channel) void channel.unsubscribe();
    };
  }, [code, refreshRoom]);

  const isHost = snapshot?.room.host_player_id === snapshot?.currentPlayerId;
  async function copyInvite() {
    await navigator.clipboard.writeText(`${window.location.origin}/?room=${code}`);
    setMessage("초대 링크를 복사했어요!");
  }

  async function startGame() {
    setIsPending(true);
    const response = await fetch(`/api/rooms/${code}/start`, { method: "POST" });
    if (!response.ok) setMessage(await readError(response, "게임을 시작하지 못했어요."));
    else setMessage("게임을 시작했어요. 다음 단계에서 게임 화면이 연결됩니다.");
    setIsPending(false);
  }

  async function leaveRoom() {
    setIsPending(true);
    const response = await fetch(`/api/rooms/${code}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage(await readError(response, "방을 나가지 못했어요."));
      setIsPending(false);
      return;
    }
    router.push("/");
  }

  if (fatalError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fff8e8] px-5 text-center text-[#272334]">
        <div><p className="text-5xl">🚪</p><h1 className="mt-4 text-2xl font-black">대기실에 들어갈 수 없어요</h1><p className="mt-2 font-semibold text-[#71697b]">{fatalError}</p><Link href="/" className="mt-6 inline-block font-black text-[#7f62d9] underline">홈으로 돌아가기</Link></div>
      </main>
    );
  }

  if (!snapshot) return <main className="grid min-h-screen place-items-center bg-[#fff8e8]"><p className="animate-pulse font-black">대기실을 불러오는 중...</p></main>;

  return (
    <main className="min-h-screen bg-[#fff8e8] px-5 py-8 text-[#272334]">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between"><Link href="/" className="text-xl font-black">✏️ Scketch Relay</Link><span className="rounded-full bg-[#dff7f2] px-3 py-1 text-sm font-black">{snapshot.room.status === "waiting" ? "참가자 대기 중" : "게임 시작됨"}</span></header>
        <section className="mt-10 rounded-[32px] border-[3px] border-[#272334] bg-white p-6 shadow-[9px_10px_0_#272334] sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-black text-[#ff6b4a]">ROOM CODE</p><h1 className="font-mono text-4xl font-black tracking-[0.18em] sm:text-5xl">{code}</h1></div>
            <Button onClick={copyInvite} variant="secondary">초대 링크 복사</Button>
          </div>
          <div className="mt-8 flex items-center justify-between"><h2 className="text-xl font-black">참가자</h2><span className="font-black text-[#71697b]">{snapshot.players.length} / {snapshot.room.max_players}명</span></div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {snapshot.players.map((player, index) => {
              const online = onlinePlayerIds.size === 0 || onlinePlayerIds.has(player.id);
              return <li key={player.id} className="flex items-center gap-3 rounded-2xl border-2 border-[#ded8e1] bg-[#fffcf7] p-4"><span className="grid size-10 place-items-center rounded-full bg-[#ffe17b] font-black">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate font-black">{player.nickname}{player.id === snapshot.currentPlayerId && " (나)"}</p><p className={`text-xs font-bold ${online ? "text-[#29927e]" : "text-[#9a929f]"}`}>{online ? "● 온라인" : "○ 연결 끊김"}</p></div>{player.id === snapshot.room.host_player_id && <span className="rounded-full bg-[#fff2c7] px-2 py-1 text-xs font-black">방장</span>}</li>;
            })}
          </ul>
          {message && <StatusMessage>{message}</StatusMessage>}
          <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
            {isHost ? <Button onClick={startGame} size="large" disabled={isPending || snapshot.players.length < 2 || snapshot.room.status !== "waiting"}>{snapshot.players.length < 2 ? "한 명 더 기다려 주세요" : "게임 시작하기"}</Button> : <div className="rounded-2xl bg-[#f3efff] px-5 py-4 text-center font-black text-[#6548bd]">방장이 게임을 시작할 때까지 기다려 주세요</div>}
            <button onClick={leaveRoom} disabled={isPending || snapshot.room.status !== "waiting"} className="rounded-2xl px-5 py-3 font-black text-[#71697b] hover:bg-[#f3edf0] disabled:opacity-50">방 나가기</button>
          </div>
        </section>
      </div>
    </main>
  );
}
