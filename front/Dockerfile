# Build de l'application 
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serveur de production Nginx
FROM nginx:1.25.4-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Modification des permissions pour que l'utilisateur puisse gérer Nginx
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# On configure Nginx pour écouter sur le port 8080 (le port 80 est réservé à root)
RUN sed -i 's/listen 80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# On change l'utilisateur par défaut
USER appuser

COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]