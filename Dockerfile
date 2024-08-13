FROM node:20.12-slim

WORKDIR /app

COPY . .

RUN npm install

ENV NODE_ENV=production

CMD npm start