import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "default" | "large";
  variant?: "primary" | "secondary";
};

const variants = { primary: "bg-[#ff6b4a] hover:bg-[#f45b3a]", secondary: "bg-[#7f62d9] hover:bg-[#6d51c8]" } as const;
const sizes = { default: "px-5 py-3.5", large: "px-5 py-4 text-lg" } as const;

export function Button({ className = "", size = "default", variant = "primary", ...props }: ButtonProps) {
  return <button className={`min-h-11 rounded-2xl border-2 border-[#272334] font-black text-white shadow-[3px_4px_0_#272334] transition hover:-translate-y-0.5 hover:shadow-[5px_7px_0_#272334] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
