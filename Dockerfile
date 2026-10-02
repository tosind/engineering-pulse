FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY tests ./tests
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3088 DATABASE_PATH=/app/data/pulse.db
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node public ./public
RUN mkdir /app/data && chown node:node /app/data
USER node
EXPOSE 3088
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:3088/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/src/server.js"]
