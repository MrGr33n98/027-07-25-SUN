# 🔧 Guia de Teste - Painel Administrativo SolarConnect

## 🚀 Como Iniciar o Sistema

### 1. Preparar o Ambiente
```bash
cd solar-connect-nextjs

# Instalar dependências (se necessário)
npm install

# Configurar banco de dados
npm run db:push
npm run db:seed

# Iniciar o servidor
npm run dev
```

### 2. Acessar o Painel Admin
1. Abra o navegador em: `http://localhost:3001`
2. Clique em "Login" ou vá para: `http://localhost:3001/login`
3. Use as credenciais de administrador:
   - **Email:** `admin@solarconnect.com.br`
   - **Senha:** `123456789`

## 📋 Funcionalidades do Painel Admin para Testar

### 🏠 Dashboard Principal (`/admin`)
- **URL:** `http://localhost:3001/admin`
- **O que testar:**
  - Estatísticas gerais do sistema
  - Gráficos de usuários, empresas e leads
  - Resumo de atividades recentes
  - Links rápidos para outras seções

### 👥 Gestão de Usuários (`/admin/usuarios`)
- **URL:** `http://localhost:3001/admin/usuarios`
- **O que testar:**
  - Lista de todos os usuários do sistema
  - Filtros por tipo (ADMIN, COMPANY, CUSTOMER)
  - Busca por nome/email
  - Ações: visualizar, editar, desativar usuários
  - Estatísticas de usuários por tipo

### 🏢 Gestão de Empresas (`/admin/empresas`)
- **URL:** `http://localhost:3001/admin/empresas`
- **O que testar:**
  - Lista de empresas cadastradas
  - Status de aprovação (pendente, aprovada, rejeitada)
  - Filtros por status e localização
  - Ações: aprovar, rejeitar, editar empresas
  - Visualizar perfis completos das empresas

### 📊 Importação de Empresas (`/admin/empresas/importar`)
- **URL:** `http://localhost:3001/admin/empresas/importar`
- **O que testar:**
  - Upload de arquivo CSV
  - Preview dos dados antes da importação
  - Validação de dados
  - Processo de importação em lote
  - Download de template CSV

### 🛡️ Monitoramento de Segurança (`/admin/seguranca`)
- **URL:** `http://localhost:3001/admin/seguranca`
- **O que testar:**
  - Logs de tentativas de login
  - Atividades suspeitas
  - Bloqueios de IP
  - Relatórios de segurança
  - Configurações de segurança

### 📈 Relatórios (`/admin/relatorios`)
- **URL:** `http://localhost:3001/admin/relatorios`
- **O que testar:**
  - Relatórios de usuários
  - Relatórios de empresas
  - Relatórios de leads e conversões
  - Exportação de dados (CSV, PDF)
  - Filtros por período

### 🔧 Configurações do Sistema (`/admin/configuracoes`)
- **URL:** `http://localhost:3001/admin/configuracoes`
- **O que testar:**
  - Configurações gerais da plataforma
  - Parâmetros de email
  - Configurações de upload
  - Limites e quotas
  - Manutenção do sistema

### 📝 Moderação de Conteúdo (`/admin/moderacao`)
- **URL:** `http://localhost:3001/admin/moderacao`
- **O que testar:**
  - Avaliações pendentes de moderação
  - Denúncias de conteúdo
  - Comentários reportados
  - Ações de moderação

### 💬 Gestão de Mensagens (`/admin/mensagens`)
- **URL:** `http://localhost:3001/admin/mensagens`
- **O que testar:**
  - Sistema de mensagens internas
  - Notificações para usuários
  - Templates de email
  - Histórico de comunicações

### 🛍️ Gestão de Produtos (`/admin/produtos`)
- **URL:** `http://localhost:3001/admin/produtos`
- **O que testar:**
  - Catálogo de produtos das empresas
  - Aprovação de novos produtos
  - Categorização
  - Preços e disponibilidade

## 🧪 Cenários de Teste Específicos

### Teste 1: Aprovação de Empresa
1. Acesse `/admin/empresas`
2. Encontre uma empresa com status "Pendente"
3. Clique em "Visualizar"
4. Analise os dados da empresa
5. Aprove ou rejeite com justificativa
6. Verifique se o status foi atualizado

### Teste 2: Importação CSV de Empresas
1. Acesse `/admin/empresas/importar`
2. Baixe o template CSV
3. Preencha com dados de teste
4. Faça upload do arquivo
5. Verifique o preview
6. Execute a importação
7. Confirme se as empresas foram criadas

### Teste 3: Monitoramento de Segurança
1. Acesse `/admin/seguranca`
2. Verifique logs de login
3. Simule tentativas de login inválidas
4. Verifique se aparecem nos logs
5. Teste bloqueio de IP (se implementado)

### Teste 4: Geração de Relatórios
1. Acesse `/admin/relatorios`
2. Selecione um período (últimos 30 dias)
3. Gere relatório de usuários
4. Exporte em CSV
5. Verifique se os dados estão corretos

## 🔍 Pontos de Atenção para Testar

### Segurança
- [ ] Apenas usuários ADMIN podem acessar `/admin/*`
- [ ] Redirecionamento correto se não autenticado
- [ ] Logs de ações administrativas
- [ ] Validação de permissões em cada ação

### Interface
- [ ] Layout responsivo em diferentes tamanhos de tela
- [ ] Navegação intuitiva entre seções
- [ ] Feedback visual para ações (loading, sucesso, erro)
- [ ] Paginação em listas grandes

### Funcionalidade
- [ ] Filtros e busca funcionando corretamente
- [ ] Validação de formulários
- [ ] Upload de arquivos
- [ ] Exportação de dados
- [ ] Notificações e alertas

### Performance
- [ ] Carregamento rápido das páginas
- [ ] Paginação eficiente
- [ ] Cache de dados quando apropriado

## 🐛 Como Reportar Problemas

Se encontrar algum problema durante os testes:

1. **Anote o erro:**
   - URL onde ocorreu
   - Ação que estava fazendo
   - Mensagem de erro (se houver)
   - Screenshot (se possível)

2. **Verifique o console:**
   - Abra F12 → Console
   - Procure por erros em vermelho
   - Anote as mensagens de erro

3. **Teste em diferentes navegadores:**
   - Chrome, Firefox, Safari, Edge
   - Diferentes tamanhos de tela

## 📞 Credenciais de Teste Adicionais

### Usuários para Teste
- **Admin:** `admin@solarconnect.com.br` / `123456789`
- **Empresa:** `contato@solartech.com.br` / `123456789`
- **Cliente:** `cliente1@email.com` / `123456789`

### Dados de Teste
- O sistema vem com dados pré-populados via seed
- Para resetar: `npm run db:seed`
- Empresas, usuários e leads de exemplo já estão criados

---

**💡 Dica:** Mantenha o terminal aberto para ver logs em tempo real e identificar possíveis erros durante os testes!