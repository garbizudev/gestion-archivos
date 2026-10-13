FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npx ng build --configuration production

FROM node:22-slim AS backend
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=backend --chown=node:node /app/backend/package.json ./package.json
COPY --from=backend --chown=node:node /app/backend/node_modules ./node_modules
COPY --from=backend --chown=node:node /app/backend/dist ./dist
COPY --from=frontend --chown=node:node /app/frontend/dist/frontend/browser ./public
USER node
EXPOSE 3000
CMD ["sh", "-c", "npm run migration:run:prod && node dist/main.js"]
