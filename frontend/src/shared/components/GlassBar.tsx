import type { HTMLAttributes } from "react";

export function GlassBar({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-surface-low/80 backdrop-blur-[24px] shadow-[var(--shadow-ambient)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
