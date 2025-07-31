# 🖼️ Sistema de Upload de Imagens - SolarConnect

## Visão Geral

Sistema completo de upload de imagens integrado com UploadThing para gerenciar logos, banners, fotos de produtos e projetos no marketplace SolarConnect.

## 🔧 Configuração

### 1. UploadThing Setup
```bash
# Já instalado no projeto
npm install uploadthing @uploadthing/react
```

### 2. Variáveis de Ambiente
```env
# .env.local
UPLOADTHING_SECRET="your_secret_here"
UPLOADTHING_APP_ID="your_app_id_here"
```

## 📁 Arquivos Implementados

### Core Files
- [`app/api/uploadthing/core.ts`](solar-connect-nextjs/app/api/uploadthing/core.ts) - Configuração dos endpoints de upload
- [`app/api/uploadthing/route.ts`](solar-connect-nextjs/app/api/uploadthing/route.ts) - Rotas da API
- [`lib/uploadthing.ts`](solar-connect-nextjs/lib/uploadthing.ts) - Componentes helper
- [`hooks/use-uploadthing.ts`](solar-connect-nextjs/hooks/use-uploadthing.ts) - Hook personalizado

### Components
- [`components/ui/image-upload.tsx`](solar-connect-nextjs/components/ui/image-upload.tsx) - Componente de upload reutilizável
- [`components/dashboard/image-upload-manager.tsx`](solar-connect-nextjs/components/dashboard/image-upload-manager.tsx) - Gerenciador de imagens da empresa

### Pages
- [`app/dashboard/imagens/page.tsx`](solar-connect-nextjs/app/dashboard/imagens/page.tsx) - Página dedicada para upload

## 🎯 Funcionalidades

### ✅ Upload de Logo da Empresa
- **Tamanho máximo:** 4MB
- **Formato:** PNG, JPG, WebP
- **Proporção:** Quadrada (1:1)
- **Recomendado:** 400x400px
- **Atualização automática** no banco de dados

### ✅ Upload de Banner da Empresa
- **Tamanho máximo:** 8MB
- **Formato:** PNG, JPG, WebP
- **Proporção:** 16:9 (video)
- **Recomendado:** 1200x630px
- **Atualização automática** no banco de dados

### ✅ Upload de Imagens de Produtos
- **Múltiplas imagens:** Até 5 por produto
- **Tamanho máximo:** 4MB cada
- **Formato:** PNG, JPG, WebP
- **Uso:** Catálogo de produtos

### ✅ Upload de Imagens de Projetos
- **Múltiplas imagens:** Até 10 por projeto
- **Tamanho máximo:** 8MB cada
- **Formato:** PNG, JPG, WebP
- **Uso:** Portfolio de projetos

## 🔐 Segurança e Autorização

### Middleware de Autenticação
```typescript
// Apenas empresas podem fazer upload
.middleware(async ({ req }) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "COMPANY") {
    throw new Error("Only companies can upload");
  }

  return { userId: session.user.id };
})
```

### Validações
- **Autenticação:** Usuário logado
- **Autorização:** Apenas empresas (role COMPANY)
- **Tamanho:** Limites por tipo de arquivo
- **Formato:** Apenas imagens permitidas
- **Quantidade:** Limites por upload

## 🚀 Como Usar

### 1. Componente ImageUpload
```tsx
import { ImageUpload } from '@/components/ui/image-upload'
import { useUploadThing } from '@/hooks/use-uploadthing'

export function MyComponent() {
  const { startUpload } = useUploadThing("companyLogo")
  
  const handleUpload = async (files: File[]) => {
    const result = await startUpload(files)
    return result?.map(file => file.url) || []
  }

  return (
    <ImageUpload
      value={logoUrl}
      onChange={setLogoUrl}
      onUpload={handleUpload}
      aspectRatio="square"
      maxSize={4 * 1024 * 1024}
    />
  )
}
```

### 2. Página de Gerenciamento
Acesse: `/dashboard/imagens`

- Upload de logo e banner
- Visualização das imagens atuais
- Status do upload em tempo real
- Dicas de otimização

## ⚡ Endpoints Disponíveis

| Endpoint | Uso | Max Size | Max Files |
|----------|-----|----------|-----------|
| `companyLogo` | Logo da empresa | 4MB | 1 |
| `companyBanner` | Banner da empresa | 8MB | 1 |
| `productImages` | Fotos de produtos | 4MB | 5 |
| `projectImages` | Fotos de projetos | 8MB | 10 |

## 🎨 Recursos do Componente

### ImageUpload Features
- **Drag & Drop** - Arraste arquivos
- **Preview em tempo real** - Veja antes de enviar
- **Validação de arquivo** - Tipo e tamanho
- **Loading states** - Feedback visual
- **Error handling** - Mensagens de erro
- **Multiple uploads** - Vários arquivos
- **Aspect ratio** - Proporções fixas
- **Remove images** - Remover individualmente

### Estados Visuais
- **Idle:** Área de upload pronta
- **Dragging:** Indicação de drag over
- **Uploading:** Loading spinner
- **Success:** Preview da imagem
- **Error:** Mensagem de erro

## 🔄 Fluxo de Upload

1. **Usuário seleciona/arrasta arquivo**
2. **Validação client-side** (tamanho, tipo)
3. **Upload para UploadThing**
4. **Callback automático** atualiza banco
5. **UI atualizada** com nova imagem
6. **Feedback visual** para usuário

## 📊 Integração com Database

### Atualização Automática
```typescript
.onUploadComplete(async ({ metadata, file }) => {
  // Atualiza automaticamente o banco
  const company = await db.companyProfile.findUnique({
    where: { userId: metadata.userId }
  });

  if (company) {
    await db.companyProfile.update({
      where: { id: company.id },
      data: { logo: file.url }
    });
  }

  return { uploadedBy: metadata.userId, url: file.url };
})
```

## 🎯 URLs de Acesso

- **Gerenciar Imagens:** `/dashboard/imagens`
- **API Upload:** `/api/uploadthing`
- **Perfil Empresa:** `/dashboard/perfil` (inclui imagens)

## 📝 Notas Importantes

1. **UploadThing Account:** Necessário criar conta em uploadthing.com
2. **Configuração Env:** UPLOADTHING_SECRET e UPLOADTHING_APP_ID
3. **Rate Limits:** UploadThing tem limites por plano
4. **Storage:** Arquivos ficam no UploadThing CDN
5. **URLs Persistentes:** Links não expiram

## 🐛 Troubleshooting

### Erro "Unauthorized"
- Verificar se usuário está logado
- Confirmar role COMPANY

### Erro "File too large"
- Verificar limites por endpoint
- Comprimir imagem antes do upload

### Upload não aparece
- Verificar console por erros
- Confirmar configuração das env vars
- Testar conexão com UploadThing

## 🔗 Links Úteis

- [UploadThing Docs](https://docs.uploadthing.com/)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [React Dropzone](https://react-dropzone.js.org/)

Sistema pronto para produção! 🚀