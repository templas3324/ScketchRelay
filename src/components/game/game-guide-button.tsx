"use client";

import { useEffect, useState } from "react";

const guideSteps = [
  ["1", "방에 모이기", "방장이 링크를 공유하고 모두 입장하면 게임을 시작해요."],
  ["2", "문장 쓰기", "처음에는 자유롭게 문장을 쓰고, 이후에는 받은 그림을 문장으로 설명해요."],
  ["3", "그림 그리기", "받은 문장만 보고 그림으로 표현해요. 잘 그리는 것보다 재치가 중요해요!"],
  ["4", "릴레이 공개", "모든 라운드가 끝나면 문장과 그림이 어떻게 변했는지 함께 확인해요."],
] as const;

export function GameGuideButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-full border-2 border-[#272334] bg-white px-3 py-1.5 text-sm font-black shadow-[2px_2px_0_#272334] hover:bg-[#fff2c7]">❔ 게임 방법</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-[#272334]/60 px-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="game-guide-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border-[3px] border-[#272334] bg-[#fff8e8] p-6 text-[#272334] shadow-[8px_9px_0_#272334] sm:p-8">
        <div className="flex items-center justify-between"><h2 id="game-guide-title" className="text-2xl font-black">게임 방법</h2><button type="button" onClick={() => setOpen(false)} aria-label="게임 방법 닫기" className="grid size-9 place-items-center rounded-full border-2 border-[#272334] bg-white font-black">✕</button></div>
        <ol className="mt-6 grid gap-4">{guideSteps.map(([number, title, description]) => <li key={number} className="flex gap-3 rounded-2xl border-2 border-[#ded8e1] bg-white p-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ffe17b] font-black">{number}</span><div><h3 className="font-black">{title}</h3><p className="mt-1 text-sm font-semibold leading-6 text-[#71697b]">{description}</p></div></li>)}</ol>
        <p className="mt-5 rounded-2xl bg-[#dff7f2] p-4 text-sm font-bold text-[#247865]">다른 사람에게 전달되는 것은 바로 이전 결과 하나뿐이에요. 정답을 맞히기보다 자유롭게 상상해 보세요.</p>
      </section>
    </div>}
  </>;
}
