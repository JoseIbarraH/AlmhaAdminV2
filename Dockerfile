# ======================================================================
# AlmhaAdminV2 — production Dockerfile (Nuxt 4 SSR / Nitro)
#
# Multi-stage build:
#   builder → installs deps + runs `nuxt build` → produces .output/
#   runner  → copies only the self-contained .output/ (Nitro bundles its
#             own node_modules inside, so the parent node_modules is NOT
#             needed at runtime — smaller, faster image)
#
# Nuxt's `runtimeConfig.public` reads NUXT_PUBLIC_* env vars at RUNTIME
# (not build time), so no build args are needed for things like apiBase.
# Just set them in Dokploy's Environment Variables.
#
# Build:
#   docker build -t almha-admin .
#
# Run:
#   docker run -p 3000:3000 --env-file .env almha-admin
# ======================================================================

# ----------------------------------------------------------------------
# Stage 1 — builder
# ----------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps from lockfile (deterministic). --legacy-peer-deps tolerates
# the peer conflicts common in Nuxt + Tiptap + Pinia ecosystems.
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build the Nitro SSR bundle (writes to .output/)
COPY . .
RUN npm run build


# ----------------------------------------------------------------------
# Stage 2 — runtime
# ----------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Nitro server respects HOST:PORT from env.
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy only the self-contained Nitro output (includes its own node_modules).
COPY --from=builder /app/.output ./.output

# Drop root for runtime (node:alpine already has the 'node' user).
USER node

EXPOSE 3000

# Nuxt has no built-in /health route; hitting / works and is cheap.
# `start-period=30s` gives Nitro time to initialise before failing checks.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

# Nitro standalone entrypoint
CMD ["node", "./.output/server/index.mjs"]
