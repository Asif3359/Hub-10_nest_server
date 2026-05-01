# ──────────────────────────────────────────────
# Stage 1 — Install ALL dependencies (including dev)
# ──────────────────────────────────────────────
FROM node:22-alpine AS install

ENV NODE_ENV=development
WORKDIR /opt/app

COPY package*.json ./
RUN npm ci --silent

# ──────────────────────────────────────────────
# Stage 2 — Build (compile TypeScript + prune dev deps)
# ──────────────────────────────────────────────
FROM install AS build

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm run build

# Remove dev dependencies, keep only production ones
RUN rm -rf node_modules && npm ci --omit=dev --silent && npm cache clean --force

# ──────────────────────────────────────────────
# Stage 3 — Lean production runtime
# ──────────────────────────────────────────────
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /opt/app

# Copy only what's needed at runtime
COPY --from=build /opt/app/dist        ./dist
COPY --from=build /opt/app/node_modules ./node_modules
COPY --from=build /opt/app/package*.json ./
COPY --from=build /opt/app/prisma      ./prisma

# Copy healthcheck script
COPY healthcheck.js /usr/local/bin/healthcheck
RUN chmod +x /usr/local/bin/healthcheck

# Run as non-root for security
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD healthcheck

CMD ["node", "dist/main.js"]
