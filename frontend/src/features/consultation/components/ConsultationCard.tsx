import Link from "next/link";
import type { ConsultationResponse } from "@/shared/types/api";
import { StatusPill } from "@/shared/components";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConsultationCard({
  consultation,
}: {
  consultation: ConsultationResponse;
}) {
  return (
    <Link
      href={`/consultations/${consultation.id}`}
      className="flex items-center justify-between rounded-2xl bg-surface-lowest px-6 py-4 transition-shadow hover:shadow-[var(--shadow-ambient)]"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs text-on-surface-variant">
          {formatDate(consultation.created_at)} · {formatTime(consultation.created_at)}
        </p>
        <p className="text-sm font-medium text-on-surface">
          Consultation #{consultation.id.slice(0, 8)}
        </p>
      </div>

      <StatusPill status={consultation.status} />
    </Link>
  );
}
