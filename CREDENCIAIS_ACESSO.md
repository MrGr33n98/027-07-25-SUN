# 🔑 Credenciais de Acesso - SolarConnect

## Como Acessar o Sistema

### 1. 📋 Dashboard da Empresa
Para acessar o dashboard de uma empresa no marketplace:

**URL:** `http://localhost:3000/login`

**Credenciais:**
- **Email:** `contato@solartech.com.br`
- **Senha:** `123456789`

**Funcionalidades disponíveis:**
- Dashboard com estatísticas
- Gestão de produtos
- Gerenciamento de leads
- Perfil da empresa
- Mensagens
- Relatórios

### 2. 🔧 Painel Administrativo
Para acessar o painel administrativo do sistema:

**URL:** `http://localhost:3000/login`

**Credenciais:**
- **Email:** `admin@solarconnect.com.br`
- **Senha:** `123456789`

**Funcionalidades disponíveis:**
- Moderação de conteúdo
- Gestão de usuários
- Relatórios do sistema
- Configurações gerais
- Monitoramento de segurança

### 3. 👤 Conta de Cliente
Para testar como cliente:

**URL:** `http://localhost:3000/login`

**Credenciais:**
- **Email:** `cliente1@email.com`
- **Senha:** `123456789`

**Funcionalidades disponíveis:**
- Buscar empresas
- Solicitar orçamentos
- Avaliar empresas
- Favoritos

## 🚀 Como Executar

1. **Iniciar o banco de dados:**
   ```bash
   cd solar-connect-nextjs
   npm run db:seed
   ```

2. **Iniciar o servidor:**
   ```bash
   npm run dev
   ```

3. **Acessar o sistema:**
   - Abra: `http://localhost:3000`
   - Use as credenciais acima

## 📝 Notas Importantes

- Todos os usuários usam a mesma senha: `123456789`
- Os dados são criados automaticamente pelo script de seed
- Para redefinir os dados, execute: `npm run db:seed` novamente
- O sistema suporta diferentes tipos de usuário (ADMIN, COMPANY, CUSTOMER)

## 🛠️ Tipos de Usuário

| Tipo | Descrição | Acesso |
|------|-----------|--------|
| **ADMIN** | Administrador do sistema | Painel admin completo |
| **COMPANY** | Empresa fornecedora | Dashboard da empresa |
| **CUSTOMER** | Cliente final | Área do cliente |

## 🏢 Empresas de Teste

O sistema vem com 5 empresas pré-cadastradas:

1. **SolarTech Brasil** - `contato@solartech.com.br`
2. **EcoSolar Energia** - `info@ecosolar.com.br`
3. **Solar Power MG** - `vendas@solarpowermg.com.br`
4. **Rural Solar** - `contato@ruralsolar.com.br`
5. **EletroSolar Postos** - `info@eletrosolar.com.br`

Todas usam a senha: `123456789`