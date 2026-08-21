import { Hero } from "@/components/home/hero";
import { RoomPanel } from "@/components/home/room-panel";
import { GameGuideButton } from "@/components/game/game-guide-button";
import { normalizeRoomCode } from "@/lib/room";

export default async function Home({ searchParams }: { searchParams: Promise<{ room?: string | string[] }> }) {
  const room = (await searchParams).room;
  const initialRoomCode = normalizeRoomCode(typeof room === "string" ? room : "");
  return (
    <main className="min-h-screen overflow-hidden bg-[#fff8e8] text-[#272334]">
      <div className="pointer-events-none fixed inset-0 opacity-35 [background-image:radial-gradient(#ef9a61_1.2px,transparent_1.2px)] [background-size:24px_24px]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-7 sm:px-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 rotate-[-4deg] place-items-center rounded-2xl bg-[#ff6b4a] text-2xl shadow-[3px_4px_0_#272334]">✏️</span>
            <div>
              <p className="text-xl font-black tracking-[-0.04em]">Scketch Relay</p>
              <p className="text-xs font-semibold text-[#71697b]">그림으로 이어지는 엉뚱한 이야기</p>
            </div>
          </div>
          <GameGuideButton />
        </nav>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.08fr_.92fr]">
          <Hero />
          <RoomPanel initialRoomCode={initialRoomCode} />
        </div>

        <footer className="relative flex flex-col gap-2 border-t-2 border-dashed border-[#cfc5bc] pt-5 text-xs font-semibold text-[#7d7482] sm:flex-row sm:items-center sm:justify-between">
          <p>휴대폰 · 태블릿 · PC 브라우저 지원</p>
          <p>2–8명 · 권장 인원 4–6명</p>
        </footer>
      </section>
    </main>
  );
}
