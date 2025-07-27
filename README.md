# SolarConnect - Next.js

Marketplace de energia solar construído com Next.js 14, TypeScript, Prisma e Tailwind CSS.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **Tailwind CSS** - Framework CSS
- **Shadcn/ui** - Componentes UI
- **React Query** - Gerenciamento de estado e cache
- **NextAuth.js** - Autenticação
- **Zod** - Validação de schemas

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd solar-connect-nextjs
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Configure o banco de dados:
```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações
npx prisma db push

# (Opcional) Abra o Prisma Studio
npx prisma studio
```

5. Execute o projeto:
```bash
npm run dev
```

## 🏗️ Estrutura do Projeto

```
solar-connect-nextjs/
├── app/                    # App Router (Next.js 14)
│   ├── api/               # API Routes
│   ├── marketplace/       # Página do marketplace
│   ├── empresa/          # Páginas de empresa
│   ├── globals.css       # Estilos globais
│   ├── layout.tsx        # Layout raiz
│   └── page.tsx          # Homepage
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Shadcn/ui)
│   ├── layout/           # Componentes de layout
│   ├── marketplace/      # Componentes do marketplace
│   └── sections/         # Seções da homepage
├── lib/                  # Utilitários e configurações
│   ├── db.ts            # Configuração do Prisma
│   ├── utils.ts         # Funções utilitárias
│   └── validations.ts   # Schemas de validação
├── prisma/              # Schema do banco de dados
├── types/               # Tipos TypeScript
└── public/              # Arquivos estáticos
```

## 🎯 Funcionalidades Implementadas

### ✅ Concluído
- [x] Estrutura base do Next.js 14 com App Router
- [x] Configuração do TypeScript
- [x] Setup do Tailwind CSS e Shadcn/ui
- [x] Schema do banco de dados com Prisma
- [x] Componentes de layout (Header, Footer)
- [x] Homepage com Hero section
- [x] Marketplace com busca e filtros
- [x] Cards de empresas
- [x] Sistema de paginação
- [x] APIs para buscar empresas
- [x] Tipagem completa com TypeScript

### 🚧 Em Desenvolvimento
- [ ] Páginas de perfil de empresa
- [ ] Sistema de autenticação
- [ ] Dashboard de empresas
- [ ] Sistema de avaliações
- [ ] Upload de imagens
- [ ] Sistema de produtos
- [ ] Formulários de contato

### 📋 Próximos Passos
- [ ] Implementar NextAuth.js
- [ ] Criar páginas de empresa individuais
- [ ] Adicionar sistema de cadastro
- [ ] Implementar dashboard
- [ ] Adicionar testes
- [ ] Otimizações de SEO
- [ ] Deploy na Vercel

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm run start

# Linting
npm run lint

# Prisma
npm run db:push      # Aplicar mudanças no schema
npm run db:studio    # Abrir Prisma Studio
npm run db:generate  # Gerar cliente Prisma
```

## 🌐 Rotas Principais

- `/` - Homepage
- `/marketplace` - Marketplace de empresas
- `/empresa/[slug]` - Perfil da empresa
- `/cadastro` - Cadastro de empresa
- `/login` - Login
- `/dashboard` - Dashboard da empresa

## 📊 Performance e SEO

- **SSG** para homepage e páginas estáticas
- **ISR** para marketplace e perfis de empresa
- **SSR** para dashboard e páginas autenticadas
- Meta tags dinâmicas
- Otimização de imagens com Next.js Image
- Core Web Vitals otimizados

## 🚀 Deploy

O projeto está configurado para deploy na Vercel:

1. Conecte seu repositório na Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## 📝 Licença

Este projeto está sob a licença MIT.