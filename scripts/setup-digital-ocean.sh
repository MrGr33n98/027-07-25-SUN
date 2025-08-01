#!/bin/bash

# =============================================================================
# SolarConnect - Setup Script para Digital Ocean
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funções
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Banner
echo -e "${BLUE}"
echo "=================================================="
echo "🌊 SolarConnect - Setup Digital Ocean"
echo "=================================================="
echo -e "${NC}"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root. Use: sudo $0"
fi

# 1. Atualizar sistema
log "Atualizando sistema..."
apt update && apt upgrade -y
success "Sistema atualizado"

# 2. Instalar dependências básicas
log "Instalando dependências básicas..."
apt install -y curl wget git nano htop unzip ufw
success "Dependências instaladas"

# 3. Instalar Docker
log "Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    success "Docker instalado"
else
    success "Docker já está instalado"
fi

# 4. Instalar Docker Compose
log "Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    success "Docker Compose instalado"
else
    success "Docker Compose já está instalado"
fi

# 5. Configurar firewall
log "Configurando firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable
success "Firewall configurado"

# 6. Criar diretório da aplicação
log "Criando diretório da aplicação..."
mkdir -p /opt/solarconnect
cd /opt/solarconnect
success "Diretório criado: /opt/solarconnect"

# 7. Configurar usuário para Docker
log "Configurando usuário para Docker..."
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
    success "Usuário $SUDO_USER adicionado ao grupo docker"
else
    warning "Variável SUDO_USER não encontrada. Configure manualmente: usermod -aG docker seu-usuario"
fi

# 8. Criar arquivo docker-compose.prod.yml
log "Criando arquivo docker-compose.prod.yml..."
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  next-app:
    container_name: solarconnect-app
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: "postgresql://solarconnect:senha-super-segura@postgres:5432/solarconnect"
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - solarconnect-network
    volumes:
      - app-uploads:/app/uploads

  postgres:
    image: postgres:15-alpine
    container_name: solarconnect-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: solarconnect
      POSTGRES_PASSWORD: senha-super-segura
      POSTGRES_DB: solarconnect
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - solarconnect-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U solarconnect"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: solarconnect-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - next-app
    networks:
      - solarconnect-network

volumes:
  postgres_data:
  app-uploads:

networks:
  solarconnect-network:
    driver: bridge
EOF
success "Arquivo docker-compose.prod.yml criado"

# 9. Criar configuração do Nginx
log "Criando configuração do Nginx..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server next-app:3000;
    }

    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name _;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /_next/static/ {
            proxy_pass http://nextjs;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF
success "Configuração do Nginx criada"

# 10. Criar diretório de backups
log "Criando diretório de backups..."
mkdir -p backups
chmod 755 backups
success "Diretório de backups criado"

# 11. Criar script de monitoramento
log "Criando script de monitoramento..."
cat > monitor.sh << 'EOF'
#!/bin/bash

cd /opt/solarconnect

# Verificar se containers estão rodando
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "⚠️ Alguns containers não estão rodando!"
    docker-compose -f docker-compose.prod.yml up -d
fi

# Verificar espaço em disco
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️ Espaço em disco baixo: ${DISK_USAGE}%"
fi

# Verificar memória
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 85 ]; then
    echo "⚠️ Uso de memória alto: ${MEMORY_USAGE}%"
fi

echo "✅ Sistema funcionando normalmente - $(date)"
EOF
chmod +x monitor.sh
success "Script de monitoramento criado"

# 12. Criar script de backup
log "Criando script de backup..."
cat > backup.sh << 'EOF'
#!/bin/bash

cd /opt/solarconnect

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Criar backup do banco
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U solarconnect solarconnect > $BACKUP_FILE

# Comprimir backup
gzip $BACKUP_FILE

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "✅ Backup criado: ${BACKUP_FILE}.gz - $(date)"
EOF
chmod +x backup.sh
success "Script de backup criado"

# 13. Criar arquivo .env.production de exemplo
log "Criando arquivo .env.production de exemplo..."
cat > .env.production.example << 'EOF'
# =============================================================================
# SolarConnect - Digital Ocean Production
# =============================================================================

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://SEU-IP-AQUI:3000
PORT=3000

# Database
DATABASE_URL="postgresql://solarconnect:senha-super-segura@postgres:5432/solarconnect"

# Authentication
NEXTAUTH_URL=http://SEU-IP-AQUI:3000
NEXTAUTH_SECRET="sua-chave-super-secreta-aqui-mude-isso"

# Email (Resend)
RESEND_API_KEY="sua-chave-do-resend"

# Upload (UploadThing)
UPLOADTHING_SECRET="sua-chave-uploadthing"
UPLOADTHING_APP_ID="seu-app-id-uploadthing"

# Security
ENABLE_RATE_LIMITING=true
LOG_LEVEL=info
EOF
success "Arquivo .env.production.example criado"

# 14. Criar script de deploy simplificado
log "Criando script de deploy..."
cat > deploy-do.sh << 'EOF'
#!/bin/bash

set -e

echo "🚀 Iniciando deploy do SolarConnect..."

# Verificar se .env.production existe
if [ ! -f ".env.production" ]; then
    echo "❌ Arquivo .env.production não encontrado!"
    echo "Copie .env.production.example para .env.production e configure as variáveis"
    exit 1
fi

# Build e deploy
echo "📦 Fazendo build da aplicação..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🔄 Parando containers antigos..."
docker-compose -f docker-compose.prod.yml down

echo "🚀 Iniciando novos containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Aguardando containers iniciarem..."
sleep 30

echo "🗄️ Configurando banco de dados..."
docker-compose -f docker-compose.prod.yml exec next-app npx prisma generate
docker-compose -f docker-compose.prod.yml exec next-app npx prisma db push
docker-compose -f docker-compose.prod.yml exec next-app npm run db:seed

echo "✅ Deploy concluído!"
echo "🌐 Aplicação disponível em: http://$(curl -s ifconfig.me):3000"
echo "📊 Status dos containers:"
docker-compose -f docker-compose.prod.yml ps
EOF
chmod +x deploy-do.sh
success "Script de deploy criado"

# 15. Configurar crontab para monitoramento e backup
log "Configurando tarefas automáticas..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/solarconnect/monitor.sh >> /var/log/solarconnect-monitor.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/solarconnect/backup.sh >> /var/log/solarconnect-backup.log 2>&1") | crontab -
success "Tarefas automáticas configuradas"

# Finalização
echo ""
echo -e "${GREEN}=================================================="
echo "🎉 Setup concluído com sucesso!"
echo "==================================================${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Faça upload do seu código para /opt/solarconnect"
echo "2. Configure o arquivo .env.production"
echo "3. Execute: ./deploy-do.sh"
echo ""
echo -e "${BLUE}Comandos úteis:${NC}"
echo "- Deploy: ./deploy-do.sh"
echo "- Logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "- Status: docker-compose -f docker-compose.prod.yml ps"
echo "- Backup: ./backup.sh"
echo ""
echo -e "${BLUE}Localização dos arquivos:${NC}"
echo "- Aplicação: /opt/solarconnect"
echo "- Logs: /var/log/solarconnect-*.log"
echo "- Backups: /opt/solarconnect/backups"
echo ""
success "Sistema pronto para receber sua aplicação!"