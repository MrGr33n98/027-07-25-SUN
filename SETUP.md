# 🚀 Setup SolarConnect MVP

Guia rápido para configurar e executar o SolarConnect.

## ⚡ Setup Rápido (Recomendado)

### 1. Configure o Banco de Dados

**Opção A: PostgreSQL com Docker (Recomendado)**
```bash
# Execute o script automático
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

**Opção B: PostgreSQL Manual**
- Instale PostgreSQL
- Crie um banco chamado `solarconnect`
- Atualize a `DATABASE_URL` no `.env.local`

**Opção C: PostgreSQL Online (Mais fácil)**
- Crie uma conta gratuita em [Neon.tech](https://neon.tech) ou [Supabase](https://supabase.com)
- Copie a connection string
- Cole em `DATABASE_URL` no `.env.local`

### 2. Configure o Banco

```bash
# Gerar cliente Prisma
npm run db:generate

# Criar tabelas
npm run db:push

# Popular com dados de exemplo
npm run db:seed
```

### 3. Execute o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3001

## 🔑 Credenciais de Teste

**Empresa de exemplo:**
- Email: `contato@solartech.com.br`
- Senha: `123456789`

**URLs Importantes:**
- Homepage: http://localhost:3001
- Marketplace: http://localhost:3001/marketplace
- Login: http://localhost:3001/login
- Cadastro: http://localhost:3001/cadastro
- Dashboard: http://localhost:3001/dashboard

## 🎯 O que funciona agora

✅ **Sistema de Autenticação**
- Cadastro de usuários e empresas
- Login com credenciais
- Páginas protegidas

✅ **Marketplace**
- Busca e filtros de empresas
- Dados reais do banco
- Paginação

✅ **Banco de Dados**
- Schema completo
- Dados de exemplo
- Relacionamentos funcionais

## 🔧 Comandos Úteis

```bash
# Ver dados no navegador
npm run db:studio

# Resetar banco com novos dados
npm run db:reset

# Ver logs de desenvolvimento
npm run dev

# Parar container PostgreSQL
docker stop postgres-dev
```

## 📝 Próximos Passos

1. **Dashboard Completo** - Gerenciamento de empresa
2. **Upload de Imagens** - Logos e fotos
3. **Sistema de Leads** - Contatos e orçamentos
4. **Páginas de Empresa** - Perfis detalhados

## ❗ Problemas Comuns

**"Database connection error"**
- Verifique se o PostgreSQL está rodando
- Confirme a `DATABASE_URL` no `.env.local`

**"Permission denied: scripts/setup-db.sh"**
```bash
chmod +x scripts/setup-db.sh
```

**"Module not found"**
```bash
npm install