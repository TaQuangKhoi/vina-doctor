"use client";

import { Card, Button, Input } from "@/shared/components";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Settings
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Manage your profile and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">
          Doctor Profile
        </h2>
        <div className="flex flex-col gap-4">
          <Input label="Full Name" placeholder="Dr. Nguyen Van A" />
          <Input label="Specialty" placeholder="General Practice" />
          <Input label="License Number" placeholder="GP-12345" />
        </div>
      </Card>

      {/* Language */}
      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">
          Language Defaults
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Primary Dictation Language
            </label>
            <select className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:border-primary-container focus:outline-none">
              <option>Vietnamese</option>
              <option>English</option>
              <option>French</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Report Output Language
            </label>
            <select className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:border-primary-container focus:outline-none">
              <option>Vietnamese</option>
              <option>English</option>
              <option>French</option>
            </select>
          </div>
        </div>
      </Card>

      {/* AI Model Preference */}
      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">
          AI Model Preference
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            className="flex flex-col gap-2 rounded-2xl bg-surface-lowest p-5 text-left ring-2 ring-primary-container shadow-[var(--shadow-ambient)]"
          >
            <span className="text-2xl">⚡</span>
            <p className="text-sm font-semibold text-on-surface">
              Optimized Speed
            </p>
            <p className="text-xs text-on-surface-variant">
              Real-time transcription for busy walk-ins.
            </p>
          </button>
          <button
            type="button"
            className="flex flex-col gap-2 rounded-2xl bg-surface-low p-5 text-left hover:bg-surface-lowest"
          >
            <span className="text-2xl">🎯</span>
            <p className="text-sm font-semibold text-on-surface">
              Maximum Accuracy
            </p>
            <p className="text-xs text-on-surface-variant">
              Deep clinical reasoning. Best for complex cases.
            </p>
          </button>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary">Discard</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
