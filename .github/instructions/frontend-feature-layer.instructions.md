---
description: "Use when creating or modifying frontend components, hooks, pages, or API calls. Enforces feature-layer architecture: organize code by domain feature, not by file type. Applies to all frontend TypeScript and TSX files."
applyTo: "frontend/**/*.{ts,tsx}"
---

# Frontend Feature-Layer Architecture

## Directory Structure

```
frontend/src/
├── app/                         # Next.js App Router — routing ONLY
│   ├── layout.tsx               # Root layout
│   ├── (routes)/                # Route segments → import from features/
│   └── api/                     # Route handlers (server-side API)
│
├── features/                    # One folder per domain feature
│   ├── consultation/
│   │   ├── components/          # UI components scoped to this feature
│   │   ├── hooks/               # React hooks (data fetching, state)
│   │   ├── api/                 # fetch wrappers / server actions
│   │   ├── types/               # TypeScript types & interfaces
│   │   ├── utils/               # Pure helper functions
│   │   └── index.ts             # Public API — explicit barrel export
│   ├── audio-recorder/
│   ├── soap-report/
│   └── patient/
│
└── shared/                      # Shared across ≥2 features
    ├── components/              # Generic reusable UI (Button, Modal…)
    ├── hooks/                   # Generic hooks (useDebounce, useMediaQuery…)
    ├── types/                   # Global TS types / API response shapes
    ├── utils/                   # Pure utility functions
    └── lib/                     # Third-party client configs (queryClient…)
```

## Rules

### Imports
- `app/` may import from `features/` and `shared/`, never the reverse.
- Features must **not** import directly from other features — use `shared/` for cross-feature concerns.
- Always import a feature through its `index.ts` barrel, never from internal paths.

```typescript
// GOOD
import { ConsultationPanel } from '@/features/consultation';

// BAD — bypasses feature's public API
import { ConsultationPanel } from '@/features/consultation/components/ConsultationPanel';
```

### Components
- Co-locate a component with the feature it belongs to.
- A component that is used by only one feature lives in `features/<name>/components/`.
- A component used by two or more features moves to `shared/components/`.
- `app/` route files are thin: import feature components, never define JSX logic inline.

```tsx
// app/consultation/page.tsx — thin route
import { ConsultationPage } from '@/features/consultation';
export default function Page() { return <ConsultationPage />; }
```

### Hooks
- Hooks that fetch data or call server actions live in `features/<name>/hooks/`.
- Name hooks by domain action: `useConsultationSession`, `useSOAPReport`.
- Do not fetch data inside components — delegate to a hook.

```typescript
// features/soap-report/hooks/useSOAPReport.ts
export function useSOAPReport(sessionId: string) {
  // fetch logic here
}
```

### Types
- Domain types (entities) live in `features/<name>/types/`.
- API response shapes shared by multiple features live in `shared/types/`.
- Never use `any`; prefer `unknown` and narrow at boundaries.

### API Layer
- All backend calls go through `features/<name>/api/` or `shared/lib/`.
- No `fetch()` calls inside components or hooks directly — wrap them in typed functions.

```typescript
// features/audio-recorder/api/uploadAudio.ts
export async function uploadAudio(blob: Blob): Promise<{ sessionId: string }> {
  const res = await fetch('/api/audio', { method: 'POST', body: blob });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}
```

### Barrel Exports (`index.ts`)
Every feature must have an `index.ts` that explicitly exports its public surface:

```typescript
// features/consultation/index.ts
export { ConsultationPage } from './components/ConsultationPage';
export { useConsultationSession } from './hooks/useConsultationSession';
export type { Consultation, ConsultationStatus } from './types';
```

Internal implementation files are **not** exported.

## Feature Naming Convention

Use kebab-case folder names matching the medical domain:
- `consultation` — active consultation session
- `audio-recorder` — recording + upload
- `soap-report` — SOAP report viewer and editor
- `patient` — patient profile and history
- `auth` — authentication / session
