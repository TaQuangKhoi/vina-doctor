# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Enable corepack so pnpm is available without a separate install
RUN corepack enable pnpm

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json pnpm-workspace.yaml ./

RUN pnpm install

# Copy source
COPY . .

# NEXT_PUBLIC_* vars are inlined at build time by Next.js.
# Pass the public server origin (e.g. http://47.238.224.19) so the browser
# knows where to reach the backend and AI engine via nginx.
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
ARG NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_AI_ENGINE_URL=$NEXT_PUBLIC_AI_ENGINE_URL

RUN pnpm run build

# ── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# next build --output standalone emits a self-contained server at .next/standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# The standalone output places server.js at the root of the output directory
CMD ["node", "server.js"]
