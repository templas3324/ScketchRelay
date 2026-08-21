"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const COLORS = ["#272334", "#ff6b4a", "#7f62d9", "#29927e", "#f4b400"];

export function DrawingCanvas({ disabled, onSubmit }: { disabled: boolean; onSubmit: (png: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState(COLORS[0]);
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
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const next = point(event);
    context.strokeStyle = eraser ? "#ffffff" : color;
    context.lineWidth = eraser ? width * 2 : width;
    context.lineTo(next.x, next.y);
    context.stroke();
    setHasDrawing(true);
  }

  function clear() {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    setHasDrawing(false);
  }

  return <div className="mt-6">
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-[#f3efff] p-3">
      <span className="text-sm font-black">색상</span>{COLORS.map((value) => <button type="button" key={value} onClick={() => { setColor(value); setEraser(false); }} aria-label={`색상 ${value}`} className={`size-8 rounded-full border-2 border-[#272334] ${color === value && !eraser ? "ring-4 ring-[#cfc1ff]" : ""}`} style={{ backgroundColor: value }}/>) }
      <label className="ml-2 text-sm font-black">굵기 <select value={width} onChange={(event) => setWidth(Number(event.target.value))} className="rounded-lg border-2 border-[#272334] bg-white px-2 py-1"><option value="4">얇게</option><option value="8">보통</option><option value="16">굵게</option></select></label>
      <button type="button" onClick={() => setEraser((value) => !value)} className={`rounded-xl border-2 border-[#272334] px-3 py-1.5 font-black ${eraser ? "bg-[#ffe17b]" : "bg-white"}`}>지우개</button>
      <button type="button" onClick={clear} className="rounded-xl border-2 border-[#272334] bg-white px-3 py-1.5 font-black">전체 지우기</button>
    </div>
    <canvas ref={canvasRef} width={800} height={500} onPointerDown={start} onPointerMove={draw} onPointerUp={() => { drawingRef.current = false; }} onPointerCancel={() => { drawingRef.current = false; }} className="mt-4 aspect-[8/5] w-full touch-none rounded-2xl border-[3px] border-[#272334] bg-white shadow-[4px_5px_0_#272334]" />
    <Button type="button" size="large" disabled={disabled || !hasDrawing} onClick={() => { const png = canvasRef.current?.toDataURL("image/png"); if (png) onSubmit(png); }} className="mt-6 w-full">그림 제출하기</Button>
  </div>;
}
