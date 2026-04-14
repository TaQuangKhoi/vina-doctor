"use client";

import { useRef, useState, type DragEvent } from "react";

interface AudioUploadZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED = ".mp3,.wav,.m4a,.ogg,.webm,.flac";

export function AudioUploadZone({
  onFileSelected,
  disabled,
}: AudioUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-8 py-16 transition-colors ${
        dragOver
          ? "border-primary-container bg-[var(--primary-fixed)]/10"
          : "border-outline-variant bg-surface-lowest hover:border-primary-container"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container/15">
        <svg
          className="h-7 w-7 text-primary-container"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-on-surface">
          Drop your audio file here or{" "}
          <span className="font-semibold text-primary-container">browse</span>
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          MP3, WAV, M4A, OGG, WebM, FLAC
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
