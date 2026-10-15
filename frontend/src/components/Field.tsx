import type { ReactNode } from "react";

export const INPUT_CLASS =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal";

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
      {error && (
        <span role="alert" className="text-xs font-normal text-accent-600">
          {error}
        </span>
      )}
    </label>
  );
}
