# 🌊 Deploy Rápido na Digital Ocean

Guia super simples para colocar o SolarConnect no ar na Digital Ocean em poucos minutos!

## 🚀 Passo a Passo Rápido

### 1. Criar VM na Digital Ocean

1. Acesse [Digital Ocean](https://digitalocean.com)
2. Crie um **Droplet Ubuntu 22.04**
3. Escolha o plano **Basic $12/mês** (2GB RAM, 1 vCPU)
4. Anote o **IP da sua VM**

### 2. Conectar na VM

```bash
# Conectar via SSH (substitua pelo seu IP)
ssh root@SEU-IP-AQUI
```

### 3. Executar Setup Automático

```bash
# Baixar e executar script de setup
curl -fsSL https://raw.githubusercontent.com/seu-usuario/solar-connect-nextjs/main/scripts/setup-digital-ocean.sh -o setup.sh
chmod +x setup.sh
sudo ./setup.sh
```

**O script vai instalar automaticamente:**
- ✅ Docker e Docker Compose
- ✅ Nginx para proxy reverso
- ✅ Firewall configurado
- ✅ Scripts de backup e monitoramento
- ✅ Estrutura de arquivos

### 4. Fazer Upload do Código

**Opção A: Git (Recomendado)**
```bash
cd /opt/solarconnect
git clone https://github.com/seu-usuario/solar-connect-nextjs.git .
```

**Opção B: Upload via SCP**
```bash
# No seu computador local
scp -r ./solar-connect-nextjs/* root@SEU-IP:/opt/solarconnect/
```

### 5. Configurar Variáveis de Ambiente

```bash
cd /opt/solarconnect

# Copiar arquivo de exemplo
cp .env.production.example .env.production

# Editar configurações
nano .env.production
```

**Configuração mínima:**
```env
# Substitua SEU-IP-AQUI pelo IP da sua VM
NEXT_PUBLIC_APP_URL=http://SEU-IP-AQUI:3000
NEXTAUTH_URL=http://SEU-IP-AQUI:3000
NEXTAUTH_SECRET="mude-esta-chave-por-algo-super-secreto"

# Opcional: Configure email e upload
RESEND_API_KEY="sua-chave-resend"
UPLOADTHING_SECRET="sua-chave-uploadthing"
UPLOADTHING_APP_ID="seu-app-id"
```

### 6. Fazer Deploy

```bash
# Executar deploy
./deploy-do.sh
```

**Pronto! 🎉** Sua aplicação estará rodando em: `http://SEU-IP:3000`

## 🔑 Credenciais de Teste

Após o deploy, use estas credenciais para testar:

- **Email:** `contato@solartech.com.br`
- **Senha:** `123456789`

## 📊 Comandos Úteis

```bash
# Ver status dos containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs da aplicação
docker-compose -f docker-compose.prod.yml logs -f next-app

# Reiniciar aplicação
docker-compose -f docker-compose.prod.yml restart

# Fazer backup manual
./backup.sh

# Ver monitoramento
tail -f /var/log/solarconnect-monitor.log
```

## 🔧 Configurações Opcionais

### Configurar Domínio Próprio

1. **Compre um domínio** (ex: meusite.com)
2. **Configure DNS** apontando para o IP da VM
3. **Atualize .env.production:**
   ```env
   NEXT_PUBLIC_APP_URL=http://meusite.com
   NEXTAUTH_URL=http://meusite.com
   ```
4. **Reinicie:** `./deploy-do.sh`

### Configurar SSL (HTTPS)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Parar nginx
docker-compose -f docker-compose.prod.yml stop nginx

# Gerar certificado (substitua pelo seu domínio)
certbot certonly --standalone -d meusite.com

# Atualizar nginx.conf para usar SSL
# (veja DEPLOY_DIGITAL_OCEAN.md para configuração completa)

# Reiniciar
docker-compose -f docker-compose.prod.yml up -d
```

## 💰 Custos

- **VM Digital Ocean:** $12/mês
- **Domínio:** ~$10/ano (opcional)
- **Total:** ~$12/mês

## 🆘 Problemas Comuns

### "Cannot connect to Docker daemon"
```bash
# Reiniciar Docker
systemctl restart docker

# Verificar se usuário está no grupo docker
groups $USER
```

### "Port 3000 already in use"
```bash
# Ver o que está usando a porta
netstat -tulpn | grep :3000

# Parar containers
docker-compose -f docker-compose.prod.yml down
```

### "Database connection failed"
```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Ver logs do banco
docker-compose -f docker-compose.prod.yml logs postgres
```

### Aplicação não carrega
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f next-app

# Verificar se porta está aberta
ufw status | grep 3000
```

## 📞 Suporte

Se tiver problemas:

1. **Verifique os logs:** `docker-compose -f docker-compose.prod.yml logs -f`
2. **Verifique o status:** `docker-compose -f docker-compose.prod.yml ps`
3. **Reinicie tudo:** `./deploy-do.sh`
4. **Crie uma issue** no repositório

---

## 🎯 Checklist Final

- [ ] VM criada na Digital Ocean
- [ ] Script de setup executado
- [ ] Código enviado para `/opt/solarconnect`
- [ ] Arquivo `.env.production` configurado
- [ ] Deploy executado com `./deploy-do.sh`
- [ ] Aplicação acessível no navegador
- [ ] Login testado com credenciais de exemplo

**🎉 Parabéns! Seu SolarConnect está no ar!**