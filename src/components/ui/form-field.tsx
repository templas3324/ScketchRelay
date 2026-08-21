import { useId, type InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & { inputClassName?: string; label: string };

export function FormField({ inputClassName = "", label, id, ...props }: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-sm font-extrabold">{label}</span>
      <input id={inputId} className={`w-full rounded-xl border-2 border-[#d8d1dc] bg-[#fffcf7] px-4 py-3 font-bold outline-none transition placeholder:font-medium placeholder:text-[#aaa2af] focus:border-[#7f62d9] focus:ring-4 focus:ring-[#7f62d9]/10 ${inputClassName}`} {...props} />
    </label>
  );
}
