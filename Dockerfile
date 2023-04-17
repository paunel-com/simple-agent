FROM node:18.1-slim

WORKDIR /app

COPY . .

RUN npm install

ENV NODE_ENV=production

CMD npm start