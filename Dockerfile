# Build stage
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

COPY package.json pnpm-lock.yaml* .npmrc ./
# Prevent Git hooks during image builds and relax peer dep strictness while
# preserving reproducibility via the lockfile.
RUN HUSKY=0 CI=true pnpm install --frozen-lockfile --strict-peer-dependencies=false

COPY . .
RUN pnpm build

# Run stage
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
