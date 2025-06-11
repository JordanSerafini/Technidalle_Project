FROM node:18-alpine

# Informations sur l'image
LABEL maintainer="Technidalle Project"
LABEL description="Serveur MCP PostgreSQL pour la base postgres_sync"

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration npm
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY src/ ./src/

# Compiler le TypeScript
RUN npm run build

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001

# Changer les permissions du répertoire
RUN chown -R mcpuser:mcpuser /app

# Changer vers l'utilisateur non-root
USER mcpuser

# Exposer le port (optionnel, car MCP utilise stdio)
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Commande de démarrage
CMD ["node", "dist/index.js"] 