# 🗄️ Configuração do Banco de Dados

O sistema está configurado para usar PostgreSQL. Aqui estão as opções para configurar rapidamente:

## Opção 1: 🐳 Docker (Recomendado - Mais Rápido)

Execute este comando para criar um PostgreSQL local:

```bash
docker run --name postgres-solarconnect -e POSTGRES_PASSWORD=password -e POSTGRES_DB=solarconnect -p 5432:5432 -d postgres:13
```

## Opção 2: 🌐 Banco Online Gratuito (Se não tiver Docker)

### Usando Neon.tech:
1. Acesse: https://neon.tech
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a string de conexão
5. Substitua no arquivo `.env.local`:

```env
DATABASE_URL="sua-string-de-conexao-do-neon"
```

### Usando Supabase:
1. Acesse: https://supabase.com
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Vá em Settings > Database
5. Copie a "Connection string"
6. Substitua no arquivo `.env.local`

## Opção 3: 💻 PostgreSQL Local

Se você tem PostgreSQL instalado localmente:

1. Crie o banco:
```sql
CREATE DATABASE solarconnect;
```

2. Configure o usuário e senha no `.env.local`

## ⚡ Depois de Configurar o Banco:

1. **Execute as migrações:**
```bash
cd solar-connect-nextjs
npm run db:migrate
```

2. **Execute o seed (dados de teste):**
```bash
npm run db:seed
```

3. **Inicie o servidor:**
```bash
npm run dev
```

## 🔍 Verificar Conexão

Para testar se o banco está funcionando:

```bash
cd solar-connect-nextjs
npx prisma db push
```

Se aparecer "✅ Generated Prisma Client", está funcionando!

## 🐛 Problemas Comuns

### "Authentication failed"
- Verifique se o PostgreSQL está rodando
- Confirme usuário/senha no `.env.local`
- Se usando Docker, certifique-se que o container está ativo:
  ```bash
  docker ps
  ```

### "Connection refused"
- Verifique se a porta 5432 está livre
- Se usando Docker, pare outros containers PostgreSQL:
  ```bash
  docker stop $(docker ps -q --filter ancestor=postgres)
  ```

## 📝 Arquivo .env.local Atual

Seu arquivo está configurado para:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/solarconnect?schema=public"
```

Isso significa:
- **Usuário:** postgres
- **Senha:** password  
- **Host:** localhost
- **Porta:** 5432
- **Database:** solarconnect

## 🚀 Comandos Rápidos

```bash
# Opção Docker (Recomendado)
docker run --name postgres-solarconnect -e POSTGRES_PASSWORD=password -e POSTGRES_DB=solarconnect -p 5432:5432 -d postgres:13

# Configurar banco
cd solar-connect-nextjs
npm run db:migrate
npm run db:seed

# Iniciar aplicação
npm run dev
```

Depois acesse: http://localhost:3000