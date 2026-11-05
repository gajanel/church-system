FROM node:20.19.5-alpine3.22 AS build

WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
USER node
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY --chown=node:node index.html vite.config.js eslint.config.js ./
COPY --chown=node:node public ./public
COPY --chown=node:node src ./src

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27.5-alpine3.21
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
USER 101
CMD ["nginx", "-g", "daemon off;"]
