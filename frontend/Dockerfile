# ============================================================
# Dockerfile — Frontend Next.js
# ============================================================
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

# Build de producción
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
