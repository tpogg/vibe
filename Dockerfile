FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY src/ src/
COPY public/ public/
COPY index.html .

RUN mkdir -p data

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
