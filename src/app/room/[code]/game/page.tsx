import { FirstSentence } from "@/components/game/first-sentence";
import { roomCodeFromPath } from "@/lib/room-server";
import { notFound } from "next/navigation";

export default async function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const code = roomCodeFromPath((await params).code);
  if (!code) notFound();
  return <FirstSentence code={code} />;
}
