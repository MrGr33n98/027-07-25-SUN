#!/bin/bash

# =============================================================================
# Setup Personalizado para MrGr33n98 - SolarConnect
# =============================================================================

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🌟 SolarConnect Setup                     ║"
echo "║                  Configuração para MrGr33n98                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
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

# Verificar se está rodando como root ou com sudo
if [[ $EUID -ne 0 ]]; then
   error "Este script precisa ser executado como root ou com sudo"
fi

log "Iniciando configuração personalizada para MrGr33n98..."

# 1. Criar aliases personalizados
log "Configurando aliases personalizados..."
cat >> ~/.bashrc << 'EOF'

# =============================================================================
# Aliases do MrGr33n98 para SolarConnect
# =============================================================================

# Navegação rápida
alias solar='cd /opt/solarconnect'
alias solar-logs='cd /opt/solarconnect && docker-compose -f docker-compose.prod.yml logs -f next-app'
alias solar-status='cd /opt/solarconnect && echo "🌟 SolarConnect Status - MrGr33n98" && docker-compose -f docker-compose.prod.yml ps && echo -e "\n💾 Disco:" && df -h | head -2 && echo -e "\n🧠 Memória:" && free -h && echo -e "\n🌐 App:" && curl -s http://localhost:3000/api/health | grep -q "healthy" && echo "✅ OK" || echo "❌ Problema"'
alias solar-deploy='cd /opt/solarconnect && echo "🚀 Deploy iniciado por MrGr33n98..." && git pull && ./deploy-do.sh'
alias solar-errors='cd /opt/solarconnect && docker-compose -f docker-compose.prod.yml logs next-app | grep -i "error\|warn\|fail" | tail -20'
alias solar-backup='cd /opt/solarconnect && ./backup.sh && echo "✅ Backup criado por MrGr33n98"'
alias solar-restart='cd /opt/solarconnect && docker-compose -f docker-compose.prod.yml restart && echo "🔄 SolarConnect reiniciado"'
alias solar-clean='cd /opt/solarconnect && docker system prune -f && echo "🧹 Limpeza concluída"'

# Função para status completo
solar-check() {
    echo "🔍 Verificação Completa - MrGr33n98"
    echo "=================================="
    cd /opt/solarconnect
    
    echo "📦 Containers:"
    docker-compose -f docker-compose.prod.yml ps
    
    echo -e "\n💾 Espaço em disco:"
    df -h | grep -E "(Filesystem|/dev/vda|/dev/sda)"
    
    echo -e "\n🧠 Memória:"
    free -h
    
    echo -e "\n🌐 Teste da aplicação:"
    if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
        echo "✅ Aplicação funcionando normalmente"
    else
        echo "❌ Aplicação com problemas - verificar logs"
    fi
    
    echo -e "\n📊 Últimos backups:"
    ls -la backups/ | tail -5
    
    echo -e "\n=================================="
    echo "Verificação concluída! 🎯"
}

EOF

success "Aliases configurados"

# 2. Criar script de monitoramento personalizado
log "Criando script de monitoramento..."
cat > /opt/solarconnect/monitor-mrgreen98.sh << 'EOF'
#!/bin/bash

# Monitor personalizado do MrGr33n98
LOG_FILE="/var/log/solarconnect-mrgreen98.log"
DATE=$(date +'%Y-%m-%d %H:%M:%S')

# Função para log
log() {
    echo "[$DATE] MrGr33n98: $1" >> $LOG_FILE
}

cd /opt/solarconnect

# Verificar se aplicação responde
if ! curl -s http://localhost:3000/api/health | grep -q "healthy"; then
    log "❌ ALERTA: Aplicação não responde"
    
    # Tentar reiniciar automaticamente
    docker-compose -f docker-compose.prod.yml restart next-app
    sleep 15
    
    # Verificar novamente
    if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
        log "✅ Aplicação reiniciada com sucesso"
    else
        log "🚨 CRÍTICO: Aplicação não respondeu após reinicialização"
    fi
else
    log "✅ Aplicação funcionando normalmente"
fi

# Verificar espaço em disco
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    log "⚠️ ALERTA: Disco com ${DISK_USAGE}% de uso - executando limpeza"
    docker system prune -f >> $LOG_FILE 2>&1
    log "🧹 Limpeza automática executada"
elif [ $DISK_USAGE -gt 70 ]; then
    log "⚠️ Aviso: Disco com ${DISK_USAGE}% de uso"
fi

# Verificar memória
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -gt 90 ]; then
    log "⚠️ ALERTA: Memória com ${MEM_USAGE}% de uso"
fi

# Verificar se containers estão rodando
CONTAINERS_DOWN=$(docker-compose -f docker-compose.prod.yml ps | grep -c "Exit\|Down" || true)
if [ $CONTAINERS_DOWN -gt 0 ]; then
    log "⚠️ ALERTA: $CONTAINERS_DOWN container(s) não estão rodando"
    docker-compose -f docker-compose.prod.yml up -d
    log "🔄 Containers reiniciados automaticamente"
fi

EOF

chmod +x /opt/solarconnect/monitor-mrgreen98.sh
success "Script de monitoramento criado"

# 3. Configurar cron jobs personalizados
log "Configurando tarefas automáticas..."
(crontab -l 2>/dev/null; cat << 'EOF'

# =============================================================================
# Cron Jobs do MrGr33n98 para SolarConnect
# =============================================================================

# Monitoramento a cada 5 minutos
*/5 * * * * /opt/solarconnect/monitor-mrgreen98.sh

# Backup diário às 2h da manhã
0 2 * * * cd /opt/solarconnect && ./backup.sh >> /var/log/backup-mrgreen98.log 2>&1

# Limpeza semanal aos domingos às 3h
0 3 * * 0 cd /opt/solarconnect && docker system prune -f >> /var/log/cleanup-mrgreen98.log 2>&1

# Verificação de saúde diária às 8h
0 8 * * * cd /opt/solarconnect && ./monitor-mrgreen98.sh && echo "Verificação diária concluída - $(date)" >> /var/log/daily-check-mrgreen98.log

EOF
) | crontab -

success "Tarefas automáticas configuradas"

# 4. Criar script de status personalizado
log "Criando dashboard personalizado..."
cat > /opt/solarconnect/dashboard-mrgreen98.sh << 'EOF'
#!/bin/bash

clear
echo -e "\033[0;34m"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  🌟 SolarConnect Dashboard                   ║"
echo "║                     MrGr33n98 Edition                        ║"
echo "║                    $(date +'%d/%m/%Y %H:%M:%S')                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "\033[0m"

cd /opt/solarconnect

echo -e "\n📊 \033[1;32mStatus dos Serviços\033[0m"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose -f docker-compose.prod.yml ps

echo -e "\n🌐 \033[1;32mStatus da Aplicação\033[0m"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
    echo "✅ Aplicação: ONLINE e funcionando"
    echo "🔗 URL: http://$(curl -s ifconfig.me):3000"
else
    echo "❌ Aplicação: OFFLINE ou com problemas"
fi

echo -e "\n💾 \033[1;32mRecursos do Sistema\033[0m"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Disco:"
df -h | grep -E "(Filesystem|/dev/vda|/dev/sda)" | column -t

echo -e "\nMemória:"
free -h

echo -e "\n📈 \033[1;32mEstatísticas\033[0m"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Uptime do sistema: $(uptime -p)"
echo "Containers ativos: $(docker ps -q | wc -l)"
echo "Imagens Docker: $(docker images -q | wc -l)"
echo "Backups disponíveis: $(ls backups/*.gz 2>/dev/null | wc -l)"

echo -e "\n📋 \033[1;32mÚltimos Logs (Erros)\033[0m"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose -f docker-compose.prod.yml logs next-app | grep -i "error\|warn" | tail -3 || echo "Nenhum erro recente encontrado ✅"

echo -e "\n🎯 \033[1;32mComandos Rápidos\033[0m"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "solar-status    - Ver status completo"
echo "solar-deploy    - Fazer deploy"
echo "solar-logs      - Ver logs em tempo real"
echo "solar-backup    - Criar backup"
echo "solar-restart   - Reiniciar aplicação"
echo ""

EOF

chmod +x /opt/solarconnect/dashboard-mrgreen98.sh
success "Dashboard personalizado criado"

# 5. Configurar logs personalizados
log "Configurando sistema de logs..."
mkdir -p /var/log/solarconnect-mrgreen98
touch /var/log/solarconnect-mrgreen98.log
touch /var/log/backup-mrgreen98.log
touch /var/log/cleanup-mrgreen98.log
touch /var/log/daily-check-mrgreen98.log

# Configurar logrotate
cat > /etc/logrotate.d/solarconnect-mrgreen98 << 'EOF'
/var/log/*mrgreen98*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF

success "Sistema de logs configurado"

# 6. Criar arquivo de configuração personalizada
log "Criando configuração personalizada..."
cat > /opt/solarconnect/.mrgreen98-config << 'EOF'
# =============================================================================
# Configuração Personalizada do MrGr33n98
# =============================================================================

OWNER="MrGr33n98"
SETUP_DATE="$(date +'%Y-%m-%d %H:%M:%S')"
VERSION="1.0"

# Configurações de monitoramento
MONITOR_INTERVAL="5"  # minutos
BACKUP_RETENTION="30" # dias
DISK_ALERT_THRESHOLD="85" # porcentagem
MEMORY_ALERT_THRESHOLD="90" # porcentagem

# Configurações de deploy
AUTO_RESTART_ON_FAILURE="true"
BACKUP_BEFORE_DEPLOY="true"
NOTIFICATION_EMAIL=""

# Configurações de limpeza
AUTO_CLEANUP_ENABLED="true"
CLEANUP_SCHEDULE="weekly"
KEEP_IMAGES="5"
KEEP_LOGS_DAYS="7"

EOF

success "Configuração personalizada criada"

# 7. Aplicar configurações do bash
log "Aplicando configurações..."
source ~/.bashrc 2>/dev/null || true

# 8. Teste final
log "Executando teste final..."
cd /opt/solarconnect

if [ -f "docker-compose.prod.yml" ]; then
    success "Arquivo de produção encontrado"
else
    warning "Arquivo docker-compose.prod.yml não encontrado"
fi

# Finalização
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 Setup Concluído!                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Configuração personalizada para MrGr33n98 instalada com sucesso!${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Execute: source ~/.bashrc"
echo "2. Teste: solar-status"
echo "3. Veja o dashboard: ./dashboard-mrgreen98.sh"
echo "4. Leia o guia: cat GUIA_USUARIO_MRGREEN98.md"
echo ""
echo -e "${BLUE}Comandos principais:${NC}"
echo "• solar-status  - Status completo"
echo "• solar-deploy  - Deploy automático"
echo "• solar-logs    - Logs em tempo real"
echo "• solar-backup  - Backup manual"
echo ""
echo -e "${GREEN}Seu SolarConnect está pronto para produção! 🚀${NC}"
echo ""