FROM node:18-alpine

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port
EXPOSE 3004

# Démarrer l'application
CMD ["npm", "run", "start:prod"] 