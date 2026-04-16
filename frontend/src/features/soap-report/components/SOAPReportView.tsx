"use client";

import { useState } from "react";
import type { SOAPReport } from "@/shared/types/api";
import type { ReportLanguage } from "../types";
import { MedicationTable } from "./MedicationTable";

const LANG_LABELS: Record<ReportLanguage, string> = {
  vn: "Tiếng Việt",
  en: "English",
  fr: "Français",
  ar: "العربية",
};

function getText(
  field: { vn?: string; en?: string; fr?: string; ar?: string } | undefined,
  lang: ReportLanguage,
): string {
  if (!field) return "—";
  return field[lang] ?? field["en"] ?? "—";
}

const SECTIONS: { key: keyof Pick<SOAPReport, "subjective" | "objective" | "assessment" | "plan">; label: string }[] = [
  { key: "subjective", label: "Subjective" },
  { key: "objective", label: "Objective" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
];

/**
 * Renders SOAP section text with proper formatting.
 * Handles:
 *  - Existing newlines (preserved)
 *  - Inline numbered lists: "1. foo 2. bar" → split into list items
 *  - Inline bullet lists: "- foo - bar" or "• foo • bar"
 */
function FormattedContent({ text }: { text: string }) {
  // Split on existing newlines first, then detect inline numbered/bullet items
  const lines = text.split(/\n/);
  const items: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect inline numbered list: "1. ... 2. ..." — split on " N." where N is a digit(s)
    if (/^\d+\./.test(trimmed)) {
      // Already starts with a number — split siblings if any
      const parts = trimmed.split(/(?=\s\d+\.\s)/);
      for (const part of parts) {
        if (part.trim()) items.push(part.trim());
      }
    } else if (/\s\d+\.\s/.test(trimmed) && !/^\d+\./.test(trimmed)) {
      // Inline sequence without leading number e.g. "intro 1. foo 2. bar"
      const parts = trimmed.split(/(?=\s\d+\.\s)/);
      for (const part of parts) {
        if (part.trim()) items.push(part.trim());
      }
    } else {
      items.push(trimmed);
    }
  }

  // Determine if list-like (most items start with "N." or "-" or "•")
  const listLike =
    items.length > 1 &&
    items.filter((i) => /^\d+\./.test(i) || /^[-•]/.test(i)).length >
      items.length / 2;

  if (listLike) {
    return (
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => {
          // Strip leading "N. " for clean rendering inside <li>
          const body = item.replace(/^\d+\.\s*/, "").replace(/^[-•]\s*/, "");
          return (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-on-surface">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-[10px] font-bold text-primary-container">
                {i + 1}
              </span>
              <span>{body}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface break-words">
      {items.join("\n")}
    </p>
  );
}

export function SOAPReportView({ report }: { report: SOAPReport }) {
  const [lang, setLang] = useState<ReportLanguage>("vn");
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["subjective", "objective", "assessment", "plan"]),
  );

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Language tabs */}
      <div className="flex gap-2">
        {(Object.entries(LANG_LABELS) as [ReportLanguage, string][]).map(
          ([code, label]) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                lang === code
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-low text-on-surface-variant hover:bg-surface-high"
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {/* ICD-10 codes */}
      {report.icd10_codes && report.icd10_codes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {report.icd10_codes.map((code) => (
            <span
              key={code}
              className="rounded-full bg-primary-container/15 px-3 py-1 text-xs font-semibold text-primary-container"
            >
              {code}
            </span>
          ))}
        </div>
      )}

      {/* Severity */}
      {report.severity && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Severity
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              report.severity === "critical"
                ? "bg-error text-on-error"
                : report.severity === "high"
                  ? "bg-error-container text-on-error-container"
                  : report.severity === "medium"
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "bg-surface-low text-on-surface-variant"
            }`}
          >
            {report.severity}
          </span>
        </div>
      )}

      {/* SOAP Sections */}
      {SECTIONS.map(({ key, label }) => {
        const content = getText(report[key], lang);
        const isOpen = expanded.has(key);
        return (
          <div
            key={key}
            className="overflow-hidden rounded-2xl bg-surface-lowest"
          >
            <button
              type="button"
              onClick={() => toggle(key)}
              className="flex w-full items-center justify-between px-6 py-4"
            >
              <span className="font-display text-sm font-bold text-on-surface">
                {label}
              </span>
              <svg
                className={`h-4 w-4 text-on-surface-variant transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {isOpen && (
              <div className="border-t border-outline-variant/15 px-6 py-4">
                <FormattedContent text={content} />
              </div>
            )}
          </div>
        );
      })}

      {/* Medications */}
      {report.medications && report.medications.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-sm font-bold text-on-surface">
            Medications
          </h3>
          <MedicationTable medications={report.medications} />
        </div>
      )}
    </div>
  );
}
