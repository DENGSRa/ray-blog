# Build on the target device so the image matches its ARM CPU architecture.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0 \
    MAX_UPLOAD_SIZE_MB=12 \
    SEED_FILE=/app/seed/default-content.json
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server.mjs ./
COPY --from=build /app/dist ./dist
COPY data/default-content.json ./seed/default-content.json
RUN mkdir -p /app/data /app/public/uploads && chown -R node:node /app
USER node
EXPOSE 3001
CMD ["node", "server.mjs"]
