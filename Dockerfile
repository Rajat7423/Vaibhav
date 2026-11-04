FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN corepack enable && pnpm install
COPY . .
RUN pnpm build
ENV NODE_ENV=production PORT=3000 DATABASE_PATH=/data/cineverse.sqlite
EXPOSE 3000
CMD ["pnpm", "start"]
