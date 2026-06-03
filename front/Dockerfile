FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Placeholder unique qui sera gravé temporairement dans le JS compilé
ENV REACT_APP_COFRAP_API_URL=__VALUE_API_URL__
RUN npm run build

FROM nginx:1.25.4-alpine

# Création du groupe et de l'utilisateur non-root pour la sécurité (DevSecOps)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Modification des permissions pour que l'utilisateur puisse gérer Nginx sans être root
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

RUN sed -i 's/listen 80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

COPY --from=build --chown=appuser:appgroup /app/build /usr/share/nginx/html

RUN printf '#!/bin/sh\nfind /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__VALUE_API_URL__|${REACT_APP_COFRAP_API_URL}|g" {} +\nexec "$@"\n' > /docker-entrypoint.d/30-inject-env.sh && \
    chmod +x /docker-entrypoint.d/30-inject-env.sh && \
    chown appuser:appgroup /docker-entrypoint.d/30-inject-env.sh

USER appuser

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]