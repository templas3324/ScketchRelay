"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const COLORS = [
  { name: "검정", value: "#272334" },
  { name: "주황", value: "#ff6b4a" },
  { name: "보라", value: "#7f62d9" },
  { name: "초록", value: "#29927e" },
  { name: "노랑", value: "#f4b400" },
] as const;

export function DrawingCanvas({ disabled, onSubmit }: { disabled: boolean; onSubmit: (png: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [width, setWidth] = useState(8);
  const [eraser, setEraser] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
  }, []);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) };
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    event.preventDefault();
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = point(event);
    context.beginPath();
    context.moveTo(next.x, next.y);
    drawingRef.current = true;
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return;
    event.preventDefault();
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const next = point(event);
    context.strokeStyle = eraser ? "#ffffff" : color;
    context.lineWidth = eraser ? width * 2 : width;
    context.lineTo(next.x, next.y);
    context.stroke();
    setHasDrawing(true);
  }

  function end(event: PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function clear() {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    setHasDrawing(false);
  }

  return <div className="mt-6">
    <p id="drawing-instructions" className="mb-3 text-sm font-bold leading-6 text-[#71697b]">손가락, 터치펜 또는 마우스로 그려 주세요. 그림 영역 안에서는 화면이 움직이지 않아요.</p>
    <div className="grid gap-3 rounded-2xl bg-[#f3efff] p-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
      <fieldset className="flex flex-wrap items-center justify-center gap-2">
        <legend className="sr-only">펜 색상</legend>
        {COLORS.map(({ name, value }) => <button disabled={disabled} type="button" key={value} onClick={() => { setColor(value); setEraser(false); }} aria-label={`${name} 펜`} aria-pressed={color === value && !eraser} className={`size-11 rounded-full border-2 border-[#272334] disabled:opacity-50 ${color === value && !eraser ? "ring-4 ring-[#cfc1ff]" : ""}`} style={{ backgroundColor: value }}/>) }
      </fieldset>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
        <label className="grid min-h-11 gap-1 text-xs font-black sm:flex sm:items-center sm:text-sm">굵기 <select value={width} disabled={disabled} onChange={(event) => setWidth(Number(event.target.value))} className="min-h-11 rounded-lg border-2 border-[#272334] bg-white px-2"><option value="4">얇게</option><option value="8">보통</option><option value="16">굵게</option></select></label>
        <button disabled={disabled} type="button" aria-pressed={eraser} onClick={() => setEraser((value) => !value)} className={`min-h-11 rounded-xl border-2 border-[#272334] px-2 font-black disabled:opacity-50 ${eraser ? "bg-[#ffe17b]" : "bg-white"}`}>지우개</button>
        <button disabled={disabled || !hasDrawing} type="button" onClick={clear} className="min-h-11 rounded-xl border-2 border-[#272334] bg-white px-2 font-black disabled:opacity-50">전체 지우기</button>
      </div>
    </div>
    <canvas ref={canvasRef} width={800} height={500} aria-label="그림 그리기 영역" aria-describedby="drawing-instructions" onPointerDown={start} onPointerMove={draw} onPointerUp={end} onPointerCancel={end} className="mt-4 aspect-[8/5] w-full touch-none select-none rounded-2xl border-[3px] border-[#272334] bg-white shadow-[4px_5px_0_#272334]" />
    <Button type="button" size="large" disabled={disabled || !hasDrawing} onClick={() => { const png = canvasRef.current?.toDataURL("image/png"); if (png) onSubmit(png); }} className="mt-6 w-full">그림 제출하기</Button>
  </div>;
}
