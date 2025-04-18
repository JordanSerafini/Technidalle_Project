FROM node:18-alpine

# Installer les dépendances nécessaires pour MSSQL
RUN apk add --no-cache bash unixodbc-dev g++ make python3 
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Europe/Paris /etc/localtime && \
    echo "Europe/Paris" > /etc/timezone

WORKDIR /app

COPY package*.json ./

# # Installer les dépendances
# RUN npm install
# RUN npm install @nestjs/swagger swagger-ui-express --save
# RUN npm install pg dotenv mssql --save

# Copier le reste des fichiers
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port
EXPOSE 3006

# Démarrer l'application
CMD ["npm", "run", "start:dev"] 