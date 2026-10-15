# Stage 1: Build da aplicação
FROM node:24-alpine AS builder

WORKDIR /app

# Instala dependências do sistema necessárias para compilação nativa se houver
RUN apk add --no-cache python3 make g++

# Copia manifestos de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Copia o código-fonte da aplicação
COPY . .

# Compila o backend AdonisJS e o frontend Inertia/React via Vite
RUN npm run build

# Instala apenas dependências de produção dentro da pasta de distribuição build
WORKDIR /app/build
RUN npm ci --omit=dev

# Stage 2: Runner de produção
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

# Copia os artefatos compilados e suas dependências de produção
COPY --from=builder /app/build ./

# Copia o script de entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expõe a porta padrão
EXPOSE 3333

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "bin/server.js"]

