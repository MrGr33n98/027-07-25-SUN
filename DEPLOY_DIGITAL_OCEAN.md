# 🌊 Deploy SolarConnect na Digital Ocean

Guia completo para fazer deploy do SolarConnect na sua VM da Digital Ocean.

## 🚀 Preparação da VM

### 1. Especificações Recomendadas

**Mínimo para MVP:**
- **Droplet**: Basic - $12/mês
- **CPU**: 2 vCPUs
- **RAM**: 2GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS

**Recomendado para Produção:**
- **Droplet**: Basic - $24/mês
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 80GB SSD

### 2. Configuração Inicial da VM

```bash
# Conectar na VM
ssh root@seu-ip-da-vm

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências básicas
apt install -y curl wget git nano htop unzip
```

### 3. Instalar Docker e Docker Compose

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Adicionar usuário ao grupo docker
usermod -aG docker $USER

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

### 4. Configurar Firewall

```bash
# Instalar UFW
apt install -y ufw

# Configurar regras básicas
ufw default deny incoming
ufw default allow outgoing

# Permitir SSH
ufw allow ssh
ufw allow 22

# Permitir HTTP e HTTPS
ufw allow 80
ufw allow 443

# Permitir porta da aplicação (temporário)
ufw allow 3000

# Ativar firewall
ufw enable

# Verificar status
ufw status
```

## 📦 Deploy da Aplicação

### 1. Clonar o Repositório

```bash
# Criar diretório para aplicação
mkdir -p /opt/solarconnect
cd /opt/solarconnect

# Clonar repositório (substitua pela sua URL)
git clone https://github.com/seu-usuario/solar-connect-nextjs.git .

# Dar permissões
chmod +x scripts/deploy.sh
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.production

# Editar variáveis de produção
nano .env.production
```

**Configuração para Digital Ocean:**
```env
# =============================================================================
# SolarConnect - Digital Ocean Production
# =============================================================================

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://seu-ip-da-vm:3000
PORT=3000

# Database (usando container local)
DATABASE_URL="postgresql://solarconnect:senha-super-segura@postgres:5432/solarconnect"

# Authentication
NEXTAUTH_URL=http://seu-ip-da-vm:3000
NEXTAUTH_SECRET="sua-chave-super-secreta-aqui-mude-isso"

# Email (Resend - gratuito até 3000 emails/mês)
RESEND_API_KEY="sua-chave-do-resend"

# Upload (UploadThing - gratuito até 2GB)
UPLOADTHING_SECRET="sua-chave-uploadthing"
UPLOADTHING_APP_ID="seu-app-id-uploadthing"

# Database credentials
DB_USER=solarconnect
DB_PASSWORD=senha-super-segura
DB_NAME=solarconnect

# Security
ENABLE_RATE_LIMITING=true
LOG_LEVEL=info
```

### 3. Criar Docker Compose para Produção

```bash
# Criar arquivo de produção
nano docker-compose.prod.yml
```

```yaml
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
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      RESEND_API_KEY: ${RESEND_API_KEY}
      UPLOADTHING_SECRET: ${UPLOADTHING_SECRET}
      UPLOADTHING_APP_ID: ${UPLOADTHING_APP_ID}
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

  # Nginx para proxy reverso
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
```

### 4. Configurar Nginx

```bash
# Criar configuração do Nginx
nano nginx.conf
```

```nginx
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server next-app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name _;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # API rate limiting
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

        # Login rate limiting
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

        # Static files caching
        location /_next/static/ {
            proxy_pass http://nextjs;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # All other requests
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
```

### 5. Deploy da Aplicação

```bash
# Executar deploy
./scripts/deploy.sh

# Ou manualmente:
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Verificar se está rodando
docker-compose -f docker-compose.prod.yml ps
```

### 6. Configurar Banco de Dados

```bash
# Aguardar containers iniciarem
sleep 30

# Configurar banco
docker-compose -f docker-compose.prod.yml exec next-app npx prisma generate
docker-compose -f docker-compose.prod.yml exec next-app npx prisma db push
docker-compose -f docker-compose.prod.yml exec next-app npm run db:seed

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f next-app
```

## 🔧 Configuração de Domínio (Opcional)

### 1. Configurar DNS

No seu provedor de domínio, adicione um registro A:
```
Tipo: A
Nome: @ (ou seu subdomínio)
Valor: IP-DA-SUA-VM
TTL: 300
```

### 2. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Parar nginx temporariamente
docker-compose -f docker-compose.prod.yml stop nginx

# Gerar certificado
certbot certonly --standalone -d seudominio.com

# Atualizar nginx.conf para HTTPS
nano nginx.conf
```

**Nginx com SSL:**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server next-app:3000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name seudominio.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name seudominio.com;

        ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Rest of your configuration...
        location / {
            proxy_pass http://nextjs;
            # ... other proxy settings
        }
    }
}
```

```bash
# Atualizar docker-compose para montar certificados
nano docker-compose.prod.yml
```

Adicionar ao serviço nginx:
```yaml
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

```bash
# Reiniciar nginx
docker-compose -f docker-compose.prod.yml up -d nginx
```

## 📊 Monitoramento e Manutenção

### 1. Scripts de Monitoramento

```bash
# Criar script de monitoramento
nano /opt/solarconnect/monitor.sh
```

```bash
#!/bin/bash

# Verificar se containers estão rodando
if ! docker-compose -f /opt/solarconnect/docker-compose.prod.yml ps | grep -q "Up"; then
    echo "⚠️ Alguns containers não estão rodando!"
    docker-compose -f /opt/solarconnect/docker-compose.prod.yml up -d
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

echo "✅ Sistema funcionando normalmente"
```

```bash
# Tornar executável
chmod +x /opt/solarconnect/monitor.sh

# Adicionar ao crontab para executar a cada 5 minutos
crontab -e
```

Adicionar linha:
```
*/5 * * * * /opt/solarconnect/monitor.sh >> /var/log/solarconnect-monitor.log 2>&1
```

### 2. Backup Automático

```bash
# Criar script de backup
nano /opt/solarconnect/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/opt/solarconnect/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Criar backup do banco
docker-compose -f /opt/solarconnect/docker-compose.prod.yml exec -T postgres pg_dump -U solarconnect solarconnect > $BACKUP_FILE

# Comprimir backup
gzip $BACKUP_FILE

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "✅ Backup criado: ${BACKUP_FILE}.gz"
```

```bash
# Tornar executável
chmod +x /opt/solarconnect/backup.sh

# Adicionar backup diário ao crontab
crontab -e
```

Adicionar linha:
```
0 2 * * * /opt/solarconnect/backup.sh >> /var/log/solarconnect-backup.log 2>&1
```

## 🚨 Comandos Úteis

### Gerenciamento da Aplicação

```bash
# Ver status dos containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs da aplicação
docker-compose -f docker-compose.prod.yml logs -f next-app

# Ver logs do banco
docker-compose -f docker-compose.prod.yml logs -f postgres

# Reiniciar aplicação
docker-compose -f docker-compose.prod.yml restart next-app

# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Iniciar tudo
docker-compose -f docker-compose.prod.yml up -d

# Rebuild da aplicação
docker-compose -f docker-compose.prod.yml build --no-cache next-app
docker-compose -f docker-compose.prod.yml up -d next-app
```

### Monitoramento do Sistema

```bash
# Ver uso de recursos
htop

# Ver espaço em disco
df -h

# Ver logs do sistema
tail -f /var/log/syslog

# Ver containers Docker
docker ps

# Ver uso de recursos dos containers
docker stats
```

### Banco de Dados

```bash
# Conectar no banco
docker-compose -f docker-compose.prod.yml exec postgres psql -U solarconnect -d solarconnect

# Backup manual
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U solarconnect solarconnect > backup.sql

# Restaurar backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U solarconnect -d solarconnect < backup.sql
```

## 🎯 Checklist Final

- [ ] VM configurada com Docker
- [ ] Firewall configurado
- [ ] Aplicação rodando na porta 3000
- [ ] Banco de dados funcionando
- [ ] Nginx configurado como proxy
- [ ] SSL configurado (se usando domínio)
- [ ] Backups automáticos configurados
- [ ] Monitoramento configurado
- [ ] Logs sendo coletados
- [ ] Credenciais de acesso testadas

## 🔗 URLs de Acesso

Após o deploy, sua aplicação estará disponível em:

- **Aplicação**: `http://seu-ip-da-vm` (ou `https://seudominio.com`)
- **Health Check**: `http://seu-ip-da-vm/api/health`

## 💰 Custos Estimados

- **VM Digital Ocean**: $12-24/mês
- **Domínio**: $10-15/ano (opcional)
- **Resend (email)**: Gratuito até 3.000 emails/mês
- **UploadThing**: Gratuito até 2GB

**Total mensal**: ~$12-24 USD

---

🎉 **Parabéns!** Sua aplicação SolarConnect está rodando na Digital Ocean!

Para suporte, verifique os logs ou crie uma issue no repositório.