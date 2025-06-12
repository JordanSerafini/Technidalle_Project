FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port (même si en microservice, pour débug)
EXPOSE 3002

# Démarrer l'application
CMD ["npm", "run", "start:prod"] 