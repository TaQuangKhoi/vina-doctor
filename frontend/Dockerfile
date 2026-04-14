# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Enable corepack so pnpm is available without a separate install
RUN corepack enable pnpm

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json pnpm-workspace.yaml ./

RUN pnpm install

# Copy source and build
COPY . .

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
