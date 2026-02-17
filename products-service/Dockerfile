# Imagem base
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copia package.json primeiro
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia resto da aplicação
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Porta que o Nest usa
EXPOSE 3000

# Comando para rodar
CMD ["node", "dist/main.js"]
