"use client";

import { useEffect, useRef, useState } from "react";
import { fetchConsultationAudioUrl } from "@/features/consultation/api/consultation-api";

interface AudioPlayerProps {
  consultationId: string;
}

export function AudioPlayer({ consultationId }: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchConsultationAudioUrl(consultationId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrlRef.current = url;
        setAudioUrl(url);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load audio");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [consultationId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-surface-low px-4 py-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
        <span className="text-xs text-on-surface-variant">Loading audio…</span>
      </div>
    );
  }

  if (error || !audioUrl) {
    return (
      <div className="rounded-2xl bg-surface-low px-4 py-3">
        <p className="text-xs text-on-surface-variant">Audio unavailable</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface-low px-4 py-3">
      <p className="mb-2 text-xs font-medium text-on-surface-variant">Recording</p>
      <audio
        controls
        src={audioUrl}
        className="w-full"
        preload="metadata"
      />
    </div>
  );
}
