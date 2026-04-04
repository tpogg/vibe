FROM node:20-slim

WORKDIR /app

# Install dependencies for canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --production

COPY src/ ./src/

CMD ["node", "src/index.js"]
