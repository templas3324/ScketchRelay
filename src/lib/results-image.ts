import type { ResultRelay } from "@/types/game";

const CANVAS_WIDTH = 900;
const CONTENT_WIDTH = 780;

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("결과 그림을 불러오지 못했어요."));
    image.src = source;
  });
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const character of text) {
    if (context.measureText(line + character).width > maxWidth && line) {
      lines.push(line);
      line = character;
    } else line += character;
  }
  if (line) lines.push(line);
  return lines;
}

export async function createResultsImage(relays: ResultRelay[]) {
  const drawingCount = relays.flatMap((relay) => relay.submissions).filter((submission) => submission.kind === "drawing").length;
  const textCount = relays.flatMap((relay) => relay.submissions).length - drawingCount;
  const height = 150 + relays.length * 110 + drawingCount * 400 + textCount * 110;
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지를 만들 수 없는 브라우저예요.");

  context.fillStyle = "#fff8e8";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#272334";
  context.font = "900 38px sans-serif";
  context.fillText("Scketch Relay 결과", 60, 70);
  context.font = "700 18px sans-serif";
  context.fillStyle = "#71697b";
  context.fillText("문장이 그림으로, 그림이 다시 문장으로 이어진 이야기", 60, 105);
  let y = 145;

  for (const [relayIndex, relay] of relays.entries()) {
    context.fillStyle = "#ffe17b";
    context.fillRect(50, y, CONTENT_WIDTH + 20, 65);
    context.fillStyle = "#272334";
    context.font = "900 25px sans-serif";
    context.fillText(`${relayIndex + 1}. ${relay.starterNickname}에서 시작된 이야기`, 70, y + 42);
    y += 85;
    for (const submission of relay.submissions) {
      context.fillStyle = "#71697b";
      context.font = "700 15px sans-serif";
      context.fillText(`ROUND ${submission.round} · ${submission.authorNickname}`, 70, y + 22);
      if (submission.kind === "drawing") {
        const image = await loadImage(submission.content);
        context.fillStyle = "#ffffff";
        context.fillRect(70, y + 38, 700, 350);
        context.drawImage(image, 70, y + 38, 700, 350);
        y += 400;
      } else {
        context.fillStyle = "#272334";
        context.font = "900 23px sans-serif";
        const lines = wrapText(context, `“${submission.content}”`, 680);
        lines.slice(0, 2).forEach((line, index) => context.fillText(line, 90, y + 58 + index * 30));
        y += 110;
      }
    }
    y += 25;
  }
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("결과 이미지를 만들지 못했어요.")), "image/png"));
}

export function downloadResultsImage(blob: Blob, code: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `scketch-relay-${code}.png`;
  link.click();
  URL.revokeObjectURL(url);
}
