# Stage 1: BUILD
FROM node:22-alpine AS Builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Stage 2: RUNTIME
FROM nginxinc/nginx-unprivileged:alpine

COPY --from=Builder /app/dist/dashboard-fe/browser /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
