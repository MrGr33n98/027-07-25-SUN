# 🛠️ Comandos Úteis - Digital Ocean

Lista de comandos essenciais para gerenciar o SolarConnect na Digital Ocean.

## 🚀 Deploy e Gerenciamento

### Deploy da Aplicação
```bash
# Deploy completo (primeira vez ou atualizações)
cd /opt/solarconnect
./deploy-do.sh

# Deploy manual passo a passo
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Atualizar Código
```bash
# Via Git
cd /opt/solarconnect
git pull origin main
./deploy-do.sh

# Via upload manual
# (faça upload dos arquivos e execute deploy-do.sh)
```

## 📊 Monitoramento

### Status dos Containers
```bash
# Ver todos os containers
docker-compose -f docker-compose.prod.yml ps

# Ver apenas containers rodando
docker ps

# Ver uso de recursos
docker stats
```

### Logs da Aplicação
```bash
# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f next-app

# Logs do banco de dados
docker-compose -f docker-compose.prod.yml logs -f postgres

# Logs do nginx
docker-compose -f docker-compose.prod.yml logs -f nginx

# Últimas 100 linhas
docker-compose -f docker-compose.prod.yml logs --tail=100 next-app
```

### Logs do Sistema
```bash
# Logs de monitoramento
tail -f /var/log/solarconnect-monitor.log

# Logs de backup
tail -f /var/log/solarconnect-backup.log

# Logs do sistema
tail -f /var/log/syslog
```

## 🔄 Reiniciar Serviços

### Reiniciar Aplicação
```bash
# Reiniciar apenas a aplicação Next.js
docker-compose -f docker-compose.prod.yml restart next-app

# Reiniciar todos os serviços
docker-compose -f docker-compose.prod.yml restart

# Parar e iniciar (mais completo)
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Reiniciar Sistema
```bash
# Reiniciar Docker
systemctl restart docker

# Reiniciar servidor (cuidado!)
reboot
```

## 🗄️ Banco de Dados

### Conectar no Banco
```bash
# Conectar via psql
docker-compose -f docker-compose.prod.yml exec postgres psql -U solarconnect -d solarconnect

# Comandos úteis no psql:
# \dt - listar tabelas
# \q - sair
# SELECT COUNT(*) FROM "User"; - contar usuários
```

### Backup e Restore
```bash
# Backup manual
./backup.sh

# Backup com nome específico
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U solarconnect solarconnect > backup_manual.sql

# Restaurar backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U solarconnect -d solarconnect < backup_manual.sql

# Listar backups
ls -la backups/
```

### Reset do Banco (CUIDADO!)
```bash
# Resetar banco completamente
docker-compose -f docker-compose.prod.yml exec next-app npx prisma db push --force-reset
docker-compose -f docker-compose.prod.yml exec next-app npm run db:seed
```

## 🔧 Configuração

### Editar Variáveis de Ambiente
```bash
# Editar .env.production
nano .env.production

# Após editar, reiniciar aplicação
docker-compose -f docker-compose.prod.yml restart next-app
```

### Editar Configuração do Nginx
```bash
# Editar nginx.conf
nano nginx.conf

# Reiniciar nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Ver Configurações Atuais
```bash
# Ver variáveis de ambiente da aplicação
docker-compose -f docker-compose.prod.yml exec next-app env | grep -E "(NODE_ENV|DATABASE_URL|NEXTAUTH)"

# Ver IP público da VM
curl ifconfig.me

# Ver portas abertas
netstat -tulpn | grep LISTEN
```

## 🔒 Segurança

### Firewall
```bash
# Ver status do firewall
ufw status

# Adicionar nova regra
ufw allow 8080

# Remover regra
ufw delete allow 8080

# Recarregar firewall
ufw reload
```

### Atualizações de Segurança
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Atualizar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## 📈 Performance

### Monitorar Recursos
```bash
# CPU e memória
htop

# Espaço em disco
df -h

# Uso de disco por diretório
du -sh /opt/solarconnect/*

# Processos que mais consomem recursos
top
```

### Limpeza
```bash
# Limpar imagens Docker não utilizadas
docker image prune -f

# Limpar containers parados
docker container prune -f

# Limpar volumes não utilizados (CUIDADO!)
docker volume prune -f

# Limpar logs antigos
journalctl --vacuum-time=7d
```

## 🌐 Rede e Conectividade

### Testar Conectividade
```bash
# Testar se aplicação responde
curl http://localhost:3000/api/health

# Testar do exterior (substitua pelo seu IP)
curl http://SEU-IP:3000/api/health

# Testar banco de dados
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U solarconnect
```

### Verificar Portas
```bash
# Ver portas abertas
netstat -tulpn | grep :3000
netstat -tulpn | grep :80
netstat -tulpn | grep :5432

# Testar conectividade externa
telnet SEU-IP 3000
```

## 🚨 Troubleshooting

### Problemas Comuns

**Aplicação não inicia:**
```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs next-app

# Verificar se banco está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Reiniciar tudo
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

**Erro de memória:**
```bash
# Ver uso de memória
free -h

# Reiniciar containers um por vez
docker-compose -f docker-compose.prod.yml restart postgres
sleep 10
docker-compose -f docker-compose.prod.yml restart next-app
```

**Erro de disco cheio:**
```bash
# Ver espaço
df -h

# Limpar logs
journalctl --vacuum-size=100M

# Limpar Docker
docker system prune -f
```

**Banco não conecta:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Ver logs do banco
docker-compose -f docker-compose.prod.yml logs postgres

# Reiniciar banco
docker-compose -f docker-compose.prod.yml restart postgres
```

### Comandos de Emergência
```bash
# Parar tudo imediatamente
docker-compose -f docker-compose.prod.yml down

# Forçar parada de containers
docker kill $(docker ps -q)

# Reiniciar Docker completamente
systemctl restart docker

# Verificar se sistema está funcionando
./monitor.sh
```

## 📋 Checklist de Manutenção Semanal

- [ ] Verificar logs de erro: `docker-compose -f docker-compose.prod.yml logs next-app | grep -i error`
- [ ] Verificar espaço em disco: `df -h`
- [ ] Verificar backups: `ls -la backups/`
- [ ] Atualizar sistema: `apt update && apt upgrade -y`
- [ ] Limpar Docker: `docker system prune -f`
- [ ] Testar aplicação: `curl http://localhost:3000/api/health`

## 🆘 Contatos de Emergência

Se nada funcionar:

1. **Backup dos dados importantes**
2. **Anotar mensagens de erro**
3. **Criar issue no repositório**
4. **Considerar recriar a VM do zero**

---

## 📞 Comandos de Uma Linha

```bash
# Status geral
docker-compose -f docker-compose.prod.yml ps && df -h && free -h

# Logs de erro
docker-compose -f docker-compose.prod.yml logs next-app | grep -i error | tail -20

# Reiniciar tudo
docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d

# Backup rápido
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U solarconnect solarconnect | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Limpeza completa
docker system prune -f && apt autoremove -y && journalctl --vacuum-time=7d
```

Salve este arquivo como referência rápida! 📚