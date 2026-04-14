"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusPill } from "@/shared/components";
import { useConsultations } from "../hooks/useConsultations";

export function ConsultationHistoryPage() {
  const [page, setPage] = useState(0);
  const limit = 20;
  const { data, isLoading } = useConsultations(page * limit, limit);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Consultation History
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Review and manage past patient encounters.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl bg-surface-lowest shadow-[var(--shadow-ambient)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-low text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Consultation</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="px-6 py-4">
                    <div className="h-4 w-full animate-pulse rounded bg-surface-low" />
                  </td>
                </tr>
              ))}
            {!isLoading &&
              items.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-outline-variant/15 transition-colors hover:bg-surface-low"
                >
                  <td className="px-6 py-4 text-on-surface-variant">
                    {new Date(c.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 font-medium text-on-surface">
                    #{c.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/consultations/${c.id}`}
                      className="text-sm font-semibold text-primary-container hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-outline-variant/15 px-6 py-3">
          <p className="text-xs text-on-surface-variant">
            Showing {page * limit + 1} to{" "}
            {Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg px-3 py-1 text-sm font-medium text-on-surface disabled:opacity-40 hover:bg-surface-high"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg px-3 py-1 text-sm font-medium text-on-surface disabled:opacity-40 hover:bg-surface-high"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
