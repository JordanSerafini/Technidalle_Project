FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

COPY prisma ./prisma/

RUN npm install

COPY . .

EXPOSE 5599

CMD npx prisma generate && npm run start:dev 