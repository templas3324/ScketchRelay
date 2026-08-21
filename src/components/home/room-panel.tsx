"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { StatusMessage } from "@/components/ui/status-message";
import { normalizeRoomCode, validateJoinRequest, validateNickname } from "@/lib/room";

export function RoomPanel({ initialRoomCode = "" }: { initialRoomCode?: string }) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function request(path: string, body: object) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { code?: string; error?: string };
    if (!response.ok || !data.code) throw new Error(data.error ?? "요청을 처리하지 못했어요.");
    router.push(`/room/${data.code}`);
  }

  async function createRoom() {
    const validationMessage = validateNickname(nickname);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setIsPending(true);
    setMessage("");
    try {
      await request("/api/rooms", { nickname });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "방을 만들지 못했어요.");
      setIsPending(false);
    }
  }

  async function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateJoinRequest(nickname, roomCode);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setIsPending(true);
    setMessage("");
    try {
      await request(`/api/rooms/${roomCode}/join`, { nickname });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "방에 참가하지 못했어요.");
      setIsPending(false);
    }
  }

  return (
    <div className="relative">
      <div className="absolute -top-7 -left-8 rotate-[-12deg] text-5xl">💭</div>
      <div className="rounded-[32px] border-[3px] border-[#272334] bg-white p-6 shadow-[9px_10px_0_#272334] sm:p-8">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-[#ff6b4a] uppercase">Let&apos;s play</p>
            <h2 className="mt-1 text-2xl font-black">게임에 참여하세요</h2>
          </div>
          <div className="grid size-14 place-items-center rounded-full bg-[#dff7f2] text-3xl">🖍️</div>
        </div>

        <Button onClick={createRoom} size="large" className="w-full" disabled={isPending}>{isPending ? "연결 중..." : "새 방 만들기"}</Button>
        <div className="my-6 flex items-center gap-3 text-xs font-black text-[#9a929f]">
          <span className="h-px flex-1 bg-[#ded8e1]" />또는 방 코드로 참가<span className="h-px flex-1 bg-[#ded8e1]" />
        </div>
        <form onSubmit={joinRoom} className="space-y-3">
          <FormField label="닉네임" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={12} placeholder="예: 그림왕 피카소" />
          <FormField label="방 코드" value={roomCode} onChange={(event) => setRoomCode(normalizeRoomCode(event.target.value))} maxLength={6} placeholder="ABCDE" inputClassName="font-mono text-lg font-black uppercase tracking-[0.25em] placeholder:tracking-[0.25em]" />
          <Button type="submit" variant="secondary" className="w-full" disabled={isPending}>{isPending ? "연결 중..." : "방 참가하기 →"}</Button>
        </form>
        {message && <StatusMessage>{message}</StatusMessage>}
      </div>
    </div>
  );
}
