# ETAPA 1: Construcción
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Argumento para la URL de la API durante la construcción
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ETAPA 2: Producción con Nginx
FROM nginx:stable-alpine
# Copiar los archivos compilados desde la etapa anterior
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copiar configuración de Nginx para manejar el SPA (History API)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
