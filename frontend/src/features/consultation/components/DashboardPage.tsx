"use client";

import Link from "next/link";
import { Card } from "@/shared/components";
import { useConsultations } from "../hooks/useConsultations";
import { ConsultationCard } from "./ConsultationCard";

export function DashboardPage() {
  const { data, isLoading, error } = useConsultations();

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const pending = items.filter(
    (c) => c.status === "pending" || c.status === "processing",
  ).length;
  const done = items.filter((c) => c.status === "done").length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface sm:text-3xl">
            Good morning, Doctor
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            You have {total} consultation{total !== 1 ? "s" : ""} on record.
          </p>
        </div>
        <Link
          href="/consultations/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary-container px-6 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary shadow-[var(--shadow-ambient)]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Consultation
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Today&apos;s Consultations
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-on-surface">
            {total}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Pending Review
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-tertiary">
            {pending}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Completed
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-primary">
            {done}
          </p>
        </Card>
      </div>

      {/* Recent Consultations */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-on-surface">
            Recent Consultations
          </h2>
          <Link
            href="/consultations/history"
            className="text-sm font-semibold text-primary-container hover:underline"
          >
            View All
          </Link>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-surface-low"
              />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
            Failed to load consultations: {(error as Error).message}
          </p>
        )}

        {!isLoading && !error && items.length === 0 && (
          <Card className="text-center">
            <p className="text-on-surface-variant">
              No consultations yet.{" "}
              <Link
                href="/consultations/new"
                className="font-semibold text-primary-container hover:underline"
              >
                Start your first one
              </Link>
            </p>
          </Card>
        )}

        {!isLoading && items.length > 0 && (
          <div className="flex flex-col gap-3">
            {items.slice(0, 10).map((c) => (
              <ConsultationCard key={c.id} consultation={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
