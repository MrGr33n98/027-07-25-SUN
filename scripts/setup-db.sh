#!/bin/bash

echo "🐘 Configurando PostgreSQL para desenvolvimento..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Parar e remover container existente se houver
docker stop postgres-dev 2>/dev/null
docker rm postgres-dev 2>/dev/null

# Criar e iniciar container PostgreSQL
echo "📦 Criando container PostgreSQL..."
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=solarconnect \
  -p 5432:5432 \
  -d postgres:13

# Aguardar PostgreSQL inicializar
echo "⏳ Aguardando PostgreSQL inicializar..."
sleep 5

# Verificar se container está rodando
if docker ps | grep -q postgres-dev; then
    echo "✅ PostgreSQL configurado com sucesso!"
    echo "📝 Configurações:"
    echo "   - Host: localhost"
    echo "   - Port: 5432"
    echo "   - Database: solarconnect"
    echo "   - User: postgres"
    echo "   - Password: password"
    echo ""
    echo "🚀 Agora execute: npm run db:push"
else
    echo "❌ Erro ao configurar PostgreSQL"
    exit 1
fi