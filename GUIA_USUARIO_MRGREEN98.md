# 🎯 Guia do Usuário MrGr33n98 - SolarConnect

Guia personalizado para gerenciar o SolarConnect em produção.

## 👤 Informações do Usuário

- **Usuário:** MrGr33n98
- **Projeto:** SolarConnect - Marketplace de Energia Solar
- **Ambiente:** Produção (Digital Ocean)
- **Acesso:** Administrador do sistema

## 🚀 Comandos Essenciais para o Dia a Dia

### 1. Verificar Status da Aplicação
```bash
# Status rápido (use sempre que quiser verificar se está tudo ok)
cd /opt/solarconnect
docker-compose -f docker-compose.prod.yml ps

# Status detalhado com recursos
docker stats --no-stream

# Testar se aplicação responde
curl http://localhost:3000/api/health
```

### 2. Ver Logs em Tempo Real
```bash
# Logs da aplicação (para ver erros ou atividade)
docker-compose -f docker-compose.prod.yml logs -f next-app

# Para sair dos logs, pressione Ctrl+C
```

### 3. Fazer Deploy de Atualizações
```bash
# Quando você fizer mudanças no código
cd /opt/solarconnect
git pull origin main
./deploy-do.sh

# Aguarde a mensagem "🎉 Deploy concluído com sucesso!"
```

### 4. Backup Manual (Importante!)
```bash
# Criar backup antes de mudanças importantes
./backup.sh

# Verificar se backup foi criado
ls -la backups/
```

## 🔧 Configurações Específicas do MrGr33n98

### Variáveis de Ambiente Personalizadas
```bash
# Editar configurações (quando necessário)
nano .env.production

# Após editar, sempre reiniciar:
docker-compose -f docker-compose.prod.yml restart next-app
```

### Configurações Recomendadas para Seu Uso:
```env
# Suas configurações específicas
NEXT_PUBLIC_APP_URL="https://solarconnect.mrgreen98.com"
NODE_ENV="production"
LOG_LEVEL="info"
ENABLE_PERFORMANCE_MONITORING="true"
```

## 📊 Monitoramento Diário

### Checklist Diário (5 minutos)
```bash
# 1. Status dos containers
docker-compose -f docker-compose.prod.yml ps

# 2. Espaço em disco
df -h

# 3. Últimos erros (se houver)
docker-compose -f docker-compose.prod.yml logs next-app | grep -i error | tail -5

# 4. Teste rápido da aplicação
curl -s http://localhost:3000/api/health | grep -q "healthy" && echo "✅ App OK" || echo "❌ App com problema"
```

### Script Automatizado para Você
Crie um arquivo `check-status.sh`:
```bash
#!/bin/bash
echo "🔍 Verificando SolarConnect - $(date)"
echo "=================================="

# Status dos containers
echo "📦 Containers:"
docker-compose -f docker-compose.prod.yml ps

# Espaço em disco
echo -e "\n💾 Espaço em disco:"
df -h | grep -E "(Filesystem|/dev/vda)"

# Memória
echo -e "\n🧠 Memória:"
free -h

# Teste da aplicação
echo -e "\n🌐 Teste da aplicação:"
if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
    echo "✅ Aplicação funcionando normalmente"
else
    echo "❌ Aplicação com problemas - verificar logs"
fi

echo -e "\n=================================="
echo "Verificação concluída!"
```

## 🚨 Resolução de Problemas Comuns

### Problema 1: Site não carrega
```bash
# Verificar se containers estão rodando
docker-compose -f docker-compose.prod.yml ps

# Se não estiverem, iniciar:
docker-compose -f docker-compose.prod.yml up -d

# Ver logs para identificar problema:
docker-compose -f docker-compose.prod.yml logs next-app
```

### Problema 2: Erro de banco de dados
```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Reiniciar banco se necessário:
docker-compose -f docker-compose.prod.yml restart postgres

# Aguardar 10 segundos e reiniciar aplicação:
sleep 10
docker-compose -f docker-compose.prod.yml restart next-app
```

### Problema 3: Pouco espaço em disco
```bash
# Ver o que está ocupando espaço:
du -sh /opt/solarconnect/*

# Limpar imagens Docker antigas:
docker image prune -f

# Limpar logs antigos:
journalctl --vacuum-time=7d

# Limpar backups antigos (manter apenas últimos 10):
cd backups && ls -t | tail -n +11 | xargs rm -f
```

## 📈 Otimizações para Seu Ambiente

### 1. Configurar Backup Automático
Adicione ao crontab (execute `crontab -e`):
```bash
# Backup diário às 2h da manhã
0 2 * * * cd /opt/solarconnect && ./backup.sh >> /var/log/backup.log 2>&1

# Limpeza semanal aos domingos às 3h
0 3 * * 0 cd /opt/solarconnect && docker system prune -f >> /var/log/cleanup.log 2>&1
```

### 2. Monitoramento Automático
Crie um script de monitoramento `monitor-mrgreen98.sh`:
```bash
#!/bin/bash
LOG_FILE="/var/log/solarconnect-monitor.log"

# Função para log
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# Verificar se aplicação responde
if ! curl -s http://localhost:3000/api/health | grep -q "healthy"; then
    log "❌ ALERTA: Aplicação não responde"
    # Tentar reiniciar
    cd /opt/solarconnect
    docker-compose -f docker-compose.prod.yml restart next-app
    log "🔄 Tentativa de reinicialização executada"
else
    log "✅ Aplicação funcionando normalmente"
fi

# Verificar espaço em disco
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log "⚠️ ALERTA: Disco com ${DISK_USAGE}% de uso"
fi
```

### 3. Configurar Alertas por Email (Opcional)
Se quiser receber alertas por email quando algo der errado:
```bash
# Instalar mailutils
apt install mailutils -y

# Modificar o script de monitoramento para enviar email:
# echo "Problema no SolarConnect" | mail -s "Alerta SolarConnect" mrgreen98@email.com
```

## 🎯 Comandos Favoritos do MrGr33n98

### Comando Único para Status Completo
```bash
# Salve este alias no seu ~/.bashrc
alias solar-status='cd /opt/solarconnect && echo "🌟 SolarConnect Status" && docker-compose -f docker-compose.prod.yml ps && echo -e "\n💾 Disco:" && df -h | head -2 && echo -e "\n🧠 Memória:" && free -h && echo -e "\n🌐 App:" && curl -s http://localhost:3000/api/health | grep -q "healthy" && echo "✅ OK" || echo "❌ Problema"'
```

### Comando para Deploy Rápido
```bash
# Alias para deploy rápido
alias solar-deploy='cd /opt/solarconnect && git pull && ./deploy-do.sh'
```

### Comando para Logs Limpos
```bash
# Ver apenas erros importantes
alias solar-errors='cd /opt/solarconnect && docker-compose -f docker-compose.prod.yml logs next-app | grep -i "error\|warn\|fail" | tail -20'
```

## 📱 Acesso Remoto

### Via SSH (Recomendado)
```bash
# Conectar na sua VM
ssh root@SEU-IP-DA-VM

# Navegar para o projeto
cd /opt/solarconnect

# Executar comandos normalmente
```

### Via Painel Web (Se configurado)
- **Portainer:** http://SEU-IP:9000 (se instalado)
- **Aplicação:** http://SEU-IP:3000

## 🎓 Dicas Avançadas para MrGr33n98

### 1. Personalizar Dashboard
Você pode modificar o dashboard editando:
```bash
# Componentes do dashboard
nano components/dashboard/dashboard-overview.tsx

# Após modificar, fazer deploy:
solar-deploy
```

### 2. Adicionar Novas Funcionalidades
```bash
# Criar nova branch para suas modificações
git checkout -b feature/mrgreen98-customizations

# Fazer suas modificações...

# Commit e push
git add .
git commit -m "Customizações do MrGr33n98"
git push origin feature/mrgreen98-customizations
```

### 3. Backup Personalizado
```bash
# Criar backup com seu nome
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U solarconnect solarconnect | gzip > "backup_mrgreen98_$(date +%Y%m%d_%H%M%S).sql.gz"
```

## 📞 Suporte e Contatos

### Em caso de problemas:
1. **Primeiro:** Verificar logs com `solar-errors`
2. **Segundo:** Tentar reiniciar com `docker-compose -f docker-compose.prod.yml restart`
3. **Terceiro:** Fazer backup e restaurar se necessário
4. **Último recurso:** Criar issue no GitHub do projeto

### Comandos de Emergência:
```bash
# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Iniciar do zero
docker-compose -f docker-compose.prod.yml up -d

# Restaurar backup mais recente
ls -t backups/*.gz | head -1 | xargs zcat | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U solarconnect -d solarconnect
```

---

## 🏆 Resumo para MrGr33n98

**Comandos que você vai usar 90% do tempo:**
1. `solar-status` - Ver se está tudo ok
2. `solar-deploy` - Atualizar o site
3. `solar-errors` - Ver se tem algum erro
4. `./backup.sh` - Fazer backup antes de mudanças

**Lembre-se:**
- ✅ Sempre fazer backup antes de mudanças importantes
- ✅ Verificar logs quando algo não funcionar
- ✅ Manter o sistema atualizado
- ✅ Monitorar espaço em disco regularmente

**Seu SolarConnect está pronto para produção! 🚀**