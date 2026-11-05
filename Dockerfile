FROM node:20-alpine

# Cria diretório da aplicação
WORKDIR /app

# Define variáveis de ambiente de produção
ENV NODE_ENV=production
ENV PORT=3000

# Copia manifestos de dependências
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm install --omit=dev && npm cache clean --force

# Copia o código-fonte da aplicação
COPY server.js ./
COPY public ./public
COPY data ./data
COPY uploads ./uploads

# Garante que os diretórios de upload e persistência existam
RUN mkdir -p /app/uploads /app/data

# Expõe a porta 3000
EXPOSE 3000

# Volumes para persistência de dados fora do container
VOLUME ["/app/uploads", "/app/data"]

# Comando de inicialização
CMD ["node", "server.js"]
