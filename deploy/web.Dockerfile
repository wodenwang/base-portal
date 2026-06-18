FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json eslint.config.mjs ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/portal-web/package.json ./apps/portal-web/package.json
RUN pnpm install --frozen-lockfile=false
COPY apps ./apps
RUN pnpm --filter @base-portal/api prisma:generate
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/apps/portal-web/dist ./apps/portal-web/dist
EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter @base-portal/api prisma:migrate && pnpm --filter @base-portal/api prisma:seed && pnpm --filter @base-portal/api start"]
