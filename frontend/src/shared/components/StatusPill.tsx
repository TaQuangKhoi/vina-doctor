import type { ConsultationStatus } from "@/shared/types/api";

const styles: Record<ConsultationStatus, string> = {
  processing:
    "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  pending:
    "bg-secondary-fixed text-on-secondary-fixed-variant",
  done:
    "bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)]",
  failed:
    "bg-error-container text-on-error-container",
};

const labels: Record<ConsultationStatus, string> = {
  processing: "Processing",
  pending: "Pending",
  done: "Finalized",
  failed: "Failed",
};

export function StatusPill({ status }: { status: ConsultationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
