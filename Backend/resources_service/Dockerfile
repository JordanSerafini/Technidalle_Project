FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances (y compris devDependencies)
RUN npm install
# Installer le CLI NestJS globalement pour être sûr
RUN npm install -g @nestjs/cli
RUN npx prisma generate

COPY . .

EXPOSE 3005

CMD ["npm", "run", "start:dev"]
