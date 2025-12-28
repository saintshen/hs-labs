FROM node:lts-alpine AS builder
WORKDIR /app

# install deps
COPY package*.json ./
RUN npm install

# copy source and build (if build script exists)
COPY . .
RUN npm run build || true

FROM node:lts-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# copy app from builder and remove dev deps
COPY --from=builder /app ./
RUN npm prune --omit=dev || true

EXPOSE 3000
CMD ["node", "server.js"]