import type { ReactNode } from "react";

export function StatusMessage({ children }: { children: ReactNode }) {
  return <p role="status" aria-live="polite" className="mt-5 rounded-xl bg-[#fff2c7] px-4 py-3 text-center text-sm font-bold text-[#5f5331]">{children}</p>;
}
