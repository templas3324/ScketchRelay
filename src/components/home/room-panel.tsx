"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { StatusMessage } from "@/components/ui/status-message";
import { createRoomCode, normalizeRoomCode, validateJoinRequest } from "@/lib/room";

export function RoomPanel() {
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");

  function createRoom() {
    const code = createRoomCode();
    setMessage(`방 코드 ${code}가 생성됐어요. 친구에게 코드를 공유해 주세요.`);
  }

  function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateJoinRequest(nickname, roomCode);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setMessage(`${nickname.trim()}님, ${roomCode} 방으로 입장할 준비가 됐어요!`);
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

        <Button onClick={createRoom} size="large" className="w-full">새 방 만들기</Button>
        <div className="my-6 flex items-center gap-3 text-xs font-black text-[#9a929f]">
          <span className="h-px flex-1 bg-[#ded8e1]" />또는 방 코드로 참가<span className="h-px flex-1 bg-[#ded8e1]" />
        </div>
        <form onSubmit={joinRoom} className="space-y-3">
          <FormField label="닉네임" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={12} placeholder="예: 그림왕 피카소" />
          <FormField label="방 코드" value={roomCode} onChange={(event) => setRoomCode(normalizeRoomCode(event.target.value))} maxLength={6} placeholder="ABCDE" inputClassName="font-mono text-lg font-black uppercase tracking-[0.25em] placeholder:tracking-[0.25em]" />
          <Button type="submit" variant="secondary" className="w-full">방 참가하기 →</Button>
        </form>
        {message && <StatusMessage>{message}</StatusMessage>}
      </div>
    </div>
  );
}
