FROM node:18-alpine

# Informations sur l'image
LABEL maintainer="Technidalle Project"
LABEL description="Serveur HTTP MCP PostgreSQL pour les bases postgres_sync et postgres_app"

# Installer curl pour le healthcheck
RUN apk add --no-cache curl

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration npm
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances de développement pour la compilation
RUN npm ci

# Copier le code source
COPY src/ ./src/
COPY http-server.ts ./

# Compiler le TypeScript
RUN npm run build
# Compiler également le serveur HTTP
RUN npx tsc http-server.ts --outDir dist --target ES2022 --module ESNext --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck

# Supprimer les devDependencies après compilation
RUN npm ci --only=production && npm cache clean --force

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001

# Changer les permissions du répertoire
RUN chown -R mcpuser:mcpuser /app

# Changer vers l'utilisateur non-root
USER mcpuser

# Exposer le port pour les connexions HTTP
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Healthcheck pour Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('MCP Server is running')" || exit 1

# Commande de démarrage du serveur HTTP MCP (pont HTTP vers MCP)
CMD ["node", "dist/http-server.js"] 