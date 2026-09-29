# ---------- Stage 1: build ----------
FROM node:24-alpine AS builder
WORKDIR /app

# Skip mongodb-memory-server's ~100MB MongoDB binary download (only needed for tests)
ENV MONGOMS_DISABLE_POSTINSTALL=1

COPY package*.json ./
RUN npm ci

COPY tsconfig.json server.ts ./
COPY src ./src
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]