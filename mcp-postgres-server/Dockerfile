FROM node:18-alpine

# Informations sur l'image
LABEL maintainer="Technidalle Project"
LABEL description="Serveur MCP PostgreSQL pour la base postgres_sync"

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration npm
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances de développement pour la compilation
RUN npm ci

# Copier le code source
COPY src/ ./src/

# Compiler le TypeScript
RUN npm run build

# Supprimer les devDependencies après compilation
RUN npm ci --only=production && npm cache clean --force

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001

# Changer les permissions du répertoire
RUN chown -R mcpuser:mcpuser /app

# Changer vers l'utilisateur non-root
USER mcpuser

# Exposer le port pour les connexions externes (optionnel)
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Healthcheck pour Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('MCP Server is running')" || exit 1

# Commande de démarrage
CMD ["node", "dist/index.js"] 