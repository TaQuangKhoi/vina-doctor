import type { HTMLAttributes } from "react";

export function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl bg-surface-lowest p-6 shadow-[var(--shadow-ambient)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
