"use client";

import Link from "next/link";
import { Button, Card, StatusPill } from "@/shared/components";
import { useConsultation } from "@/features/consultation/hooks/useConsultation";
import { useSOAPReport } from "../hooks/useSOAPReport";
import { SOAPReportView } from "./SOAPReportView";
import { TranscriptView } from "./TranscriptView";
import { AudioPlayer } from "./AudioPlayer";
import { retryConsultation } from "@/features/consultation/api/consultation-api";

export function ConsultationDetailPage({ id }: { id: string }) {
  const consultation = useConsultation(id);
  const reportEnabled = consultation.data?.status === "done";
  const report = useSOAPReport(id, reportEnabled);

  const c = consultation.data;
  const r = report.data;

  if (consultation.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-low" />
        ))}
      </div>
    );
  }

  if (consultation.error) {
    return (
      <Card className="text-center">
        <p className="text-on-error-container">
          Failed to load consultation: {consultation.error.message}
        </p>
        <Link href="/" className="mt-2 inline-block text-sm font-semibold text-primary-container hover:underline">
          Back to Dashboard
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </Link>
          <h1 className="font-display text-xl font-bold text-on-surface sm:text-2xl lg:text-3xl">
            Consultation #{c?.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            {c?.created_at
              ? new Date(c.created_at).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {c && <StatusPill status={c.status} />}
        </div>
      </div>

      {/* Audio playback — always visible once consultation is loaded */}
      {c && (
        <Card className="p-4">
          <AudioPlayer consultationId={c.id} />
        </Card>
      )}

      {/* Processing state */}
      {(c?.status === "pending" || c?.status === "processing") && (
        <Card className="flex items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-container border-t-transparent" />
          <div>
            <p className="text-sm font-semibold text-on-surface">
              AI is {c.status === "pending" ? "queued" : "processing"} your recording…
            </p>
            <p className="text-xs text-on-surface-variant">
              This may take a few minutes. This page will update automatically.
            </p>
          </div>
        </Card>
      )}

      {/* Failed state */}
      {c?.status === "failed" && (
        <Card>
          <p className="text-sm text-on-error-container">
            Processing failed.
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={async () => {
              await retryConsultation(id);
              consultation.refetch();
            }}
            disabled={consultation.isFetching}
          >
            {consultation.isFetching ? "Retrying…" : "Retry"}
          </Button>
        </Card>
      )}

      {/* SOAP Report */}
      {reportEnabled && (
        <>
          {report.isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-low" />
              ))}
            </div>
          )}

          {report.error && (
            <Card>
              <p className="text-sm text-on-error-container">
                Failed to load report: {report.error.message}
              </p>
            </Card>
          )}

          {r?.soap && <SOAPReportView report={r.soap} />}

          {r?.transcript && r.transcript.length > 0 && (
            <Card>
              <TranscriptView turns={r.transcript} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
