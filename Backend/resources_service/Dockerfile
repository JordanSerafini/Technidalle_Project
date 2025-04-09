FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install
RUN npx prisma generate

EXPOSE 3005

CMD ["npm", "run", "start:dev"] 