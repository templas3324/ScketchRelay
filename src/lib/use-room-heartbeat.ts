"use client";

import { useEffect } from "react";

export function useRoomHeartbeat(code: string, onHeartbeat?: () => void) {
  useEffect(() => {
    let disposed = false;
    async function beat() {
      const response = await fetch(`/api/rooms/${code}/heartbeat`, { method: "POST" });
      if (response.ok && !disposed) onHeartbeat?.();
    }
    void beat();
    const timer = window.setInterval(() => void beat(), 10_000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [code, onHeartbeat]);
}
