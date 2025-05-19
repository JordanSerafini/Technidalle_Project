FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5599

CMD ["npm", "run", "start:dev"]
