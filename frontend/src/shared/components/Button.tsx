"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm";

const variants: Record<Variant, string> = {
  primary:
    "rounded-full bg-primary-container text-on-primary px-6 py-2.5 hover:bg-primary shadow-[var(--shadow-ambient)]",
  secondary:
    "rounded-lg bg-secondary-container text-on-secondary-container px-5 py-2 hover:brightness-95",
  tertiary:
    "rounded-lg bg-transparent text-on-surface px-4 py-2 hover:bg-surface-high",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}
