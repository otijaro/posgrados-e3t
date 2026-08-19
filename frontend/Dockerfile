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

# Variables públicas necesarias en tiempo de build (Next.js las "hornea" en el bundle)
ARG NEXT_PUBLIC_MICROSOFT_CLIENT_ID=""
ARG NEXT_PUBLIC_MICROSOFT_TENANT_ID=""
ENV NEXT_PUBLIC_MICROSOFT_CLIENT_ID=$NEXT_PUBLIC_MICROSOFT_CLIENT_ID
ENV NEXT_PUBLIC_MICROSOFT_TENANT_ID=$NEXT_PUBLIC_MICROSOFT_TENANT_ID

# Build de producción
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
