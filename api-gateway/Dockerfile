# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package.json primeiro (melhora cache)
COPY package*.json ./

# Instala todas dependências (inclui dev)
RUN npm install

# Copia restante da aplicação
COPY . .

# Build da aplicação Nest
RUN npm run build


# ---------- PRODUCTION STAGE ----------
FROM node:20-alpine

WORKDIR /app

# Copia apenas o necessário para produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia apenas o dist gerado
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
