const steps = [["01", "방 만들기"], ["02", "그리고 맞히기"], ["03", "함께 폭소"]] as const;

export function Hero() {
  return (
    <div>
      <div className="mb-5 inline-flex rotate-[-2deg] items-center gap-2 rounded-full bg-[#ffe17b] px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_#272334]">
        <span>🎉</span> 설치 없이 링크 하나로 시작!
      </div>
      <h1 className="max-w-2xl text-5xl leading-[1.05] font-black tracking-[-0.065em] sm:text-7xl">
        글은 그림이 되고,
        <br />그림은 <span className="relative text-[#ff5d3b]">사건<span className="absolute -bottom-2 left-0 h-2 w-full rounded-full bg-[#7fd5c8] opacity-70" /></span>이 된다.
      </h1>
      <p className="mt-7 max-w-xl text-base leading-7 font-semibold text-[#655e6d] sm:text-lg">
        친구의 문장을 그림으로, 그림을 다시 엉뚱한 문장으로 전달하세요. 마지막에 처음과 얼마나 달라졌는지 함께 공개합니다.
      </p>
      <div className="mt-9 grid max-w-xl grid-cols-3 gap-3 text-center text-sm font-extrabold">
        {steps.map(([number, label]) => (
          <div key={number} className="rounded-2xl border-2 border-[#272334] bg-white p-3 shadow-[3px_3px_0_#272334]">
            <span className="block text-xs text-[#ff6b4a]">STEP {number}</span>{label}
          </div>
        ))}
      </div>
    </div>
  );
}
