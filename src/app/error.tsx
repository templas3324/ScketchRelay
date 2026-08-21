"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#fff8e8] px-5 text-[#272334]">
      <section className="max-w-md rounded-[32px] border-[3px] border-[#272334] bg-white p-8 text-center shadow-[9px_10px_0_#272334]">
        <p className="text-4xl" aria-hidden="true">🫠</p>
        <h1 className="mt-4 text-2xl font-black">잠시 문제가 생겼어요</h1>
        <p className="mt-2 font-semibold text-[#71697b]">다시 시도해도 해결되지 않으면 잠시 후 접속해 주세요.</p>
        <Button onClick={retry} className="mt-6">다시 시도하기</Button>
      </section>
    </main>
  );
}
