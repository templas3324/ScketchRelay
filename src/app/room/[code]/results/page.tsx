import { notFound } from "next/navigation";
import { ResultsView } from "@/components/results/results-view";
import { roomCodeFromPath } from "@/lib/room-server";

export default async function ResultsPage({ params }: { params: Promise<{ code: string }> }) {
  const code = roomCodeFromPath((await params).code);
  if (!code) notFound();
  return <ResultsView code={code} />;
}
