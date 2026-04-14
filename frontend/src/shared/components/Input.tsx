"use client";

import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full border-b-2 border-outline-variant bg-transparent py-2 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary ${error ? "border-error" : ""} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
    </div>
  );
}
