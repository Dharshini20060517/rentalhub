# Multi-stage build for RentalHub

# ── Stage 1: Build Server ───────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ── Stage 2: Build Client ───────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 3: Production ─────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Copy server
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/package.json ./server/package.json

# Copy client build
COPY --from=client-build /app/client/dist ./client/dist

# Install serve for static files
RUN npm install -g serve

# Environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Start server (serves API + static client)
CMD ["sh", "-c", "cd server && node dist/index.js & serve -s client/dist -l 3000"]
