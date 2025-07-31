# Sistema de Leads e Orçamentos - SolarConnect

## Visão Geral

O sistema de leads e orçamentos permite que clientes solicitem cotações das empresas e que as empresas gerenciem essas solicitações, criando propostas comerciais estruturadas.

## Fluxo Completo

### 1. Solicitação de Orçamento (Cliente)
- Cliente acessa página da empresa
- Preenche formulário de solicitação
- Sistema cria lead automaticamente
- Empresa recebe notificação

### 2. Gestão de Leads (Empresa)
- Empresa visualiza leads no dashboard
- Pode alterar status do lead
- Pode criar orçamentos baseados no lead
- Acompanha pipeline de vendas

### 3. Criação de Orçamentos (Empresa)
- Empresa cria proposta detalhada
- Adiciona itens com quantidades e preços
- Define termos e condições
- Envia para o cliente

## Arquivos e Localização

### APIs Backend
- [`/api/leads`](app/api/leads/route.ts) - CRUD de leads
- [`/api/leads/[id]`](app/api/leads/[id]/route.ts) - Operações específicas do lead
- [`/api/quotes`](app/api/quotes/route.ts) - CRUD de orçamentos
- [`/api/quotes/[id]`](app/api/quotes/[id]/route.ts) - Operações específicas do orçamento

### Páginas Frontend
- [`/dashboard/leads`](app/dashboard/leads/page.tsx) - Lista de leads da empresa
- [`/dashboard/orcamentos`](app/dashboard/orcamentos/page.tsx) - Lista de orçamentos da empresa
- [`/empresa/[slug]`](app/empresa/[slug]/page.tsx) - Perfil da empresa com formulário de solicitação

### Componentes
- [`LeadsList`](components/dashboard/leads-list.tsx) - Lista e gestão de leads
- [`QuotesList`](components/dashboard/quotes-list.tsx) - Lista e gestão de orçamentos
- [`QuoteForm`](components/dashboard/quote-form.tsx) - Formulário de criação de orçamentos
- [`QuoteRequestForm`](components/company/quote-request-form.tsx) - Formulário público de solicitação

## Modelos de Dados

### Lead
```typescript
interface Lead {
  id: string
  name: string           // Nome do cliente
  email: string          // Email de contato
  phone: string          // Telefone
  location: string       // Localização do projeto
  projectType: string    // Tipo: Residencial, Comercial, etc.
  budget?: string        // Faixa de orçamento
  message: string        // Descrição do projeto
  status: LeadStatus     // NEW, CONTACTED, PROPOSAL_SENT, etc.
  source?: string        // Origem do lead
  companyId: string      // Empresa que recebeu
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Quote (Orçamento)
```typescript
interface Quote {
  id: string
  title: string          // Título do orçamento
  description?: string   // Descrição detalhada
  totalValue: Decimal    // Valor total
  validUntil: DateTime   // Data de validade
  status: QuoteStatus    // DRAFT, SENT, VIEWED, ACCEPTED, etc.
  terms?: string         // Termos e condições
  notes?: string         // Observações internas
  companyId: string      // Empresa que criou
  leadId?: string        // Lead relacionado (opcional)
  userId?: string        // Cliente relacionado (opcional)
  items: QuoteItem[]     // Itens do orçamento
  createdAt: DateTime
  updatedAt: DateTime
}
```

### QuoteItem
```typescript
interface QuoteItem {
  id: string
  description: string    // Descrição do item
  quantity: number       // Quantidade
  unitPrice: Decimal     // Preço unitário
  totalPrice: Decimal    // Preço total (qty * unit)
  category?: string      // Categoria do item
  quoteId: string        // ID do orçamento
}
```

## Status e Estados

### Lead Status
- `NEW` - Novo lead recebido
- `CONTACTED` - Cliente já foi contatado
- `PROPOSAL_SENT` - Proposta enviada
- `NEGOTIATING` - Em negociação
- `CLOSED` - Fechado com sucesso
- `LOST` - Lead perdido

### Quote Status
- `DRAFT` - Rascunho (editável)
- `SENT` - Enviado para cliente
- `VIEWED` - Visualizado pelo cliente
- `ACCEPTED` - Aceito pelo cliente
- `REJECTED` - Rejeitado pelo cliente
- `EXPIRED` - Expirado

## Funcionalidades Implementadas

### Para Clientes
- ✅ Formulário de solicitação de orçamento
- ✅ Validação de dados obrigatórios
- ✅ Confirmação de envio
- ✅ Seleção de tipo de projeto e faixa de orçamento

### Para Empresas - Leads
- ✅ Lista com filtros por status
- ✅ Estatísticas de conversão
- ✅ Atualização de status
- ✅ Visualização de detalhes completos
- ✅ Notificações de novos leads

### Para Empresas - Orçamentos
- ✅ Criação de orçamentos estruturados
- ✅ Múltiplos itens com cálculo automático
- ✅ Categorização de itens
- ✅ Definição de termos e condições
- ✅ Controle de validade
- ✅ Estados de workflow (rascunho → enviado → aceito/rejeitado)

## Validações e Regras de Negócio

### Validações de Entrada
- Email válido e obrigatório
- Telefone com mínimo 10 caracteres
- Mensagem com mínimo 10 caracteres
- Pelo menos um item no orçamento
- Valores numéricos positivos
- Data de validade futura

### Regras de Segurança
- Apenas empresas autenticadas podem ver seus leads
- Apenas empresas podem criar orçamentos
- Clientes só veem seus próprios orçamentos
- Não é possível excluir orçamentos já enviados

### Notificações
- Lead recebido → Notificação para empresa
- Status alterado → Log interno
- Orçamento visualizado → Atualização automática de status

## Integrações

### Sistema de Notificações
- Notificações em tempo real para novos leads
- Histórico de mudanças de status
- Alertas para orçamentos próximos do vencimento

### Sistema de Usuários
- Autenticação via NextAuth
- Controle de acesso por role (COMPANY/CUSTOMER)
- Sessões seguras

## Métricas e Analytics

### Dashboard de Leads
- Total de leads recebidos
- Taxa de conversão por status
- Leads por período
- Origem dos leads

### Dashboard de Orçamentos
- Orçamentos criados vs enviados
- Taxa de aceitação
- Valor médio dos orçamentos
- Tempo médio de resposta

## APIs Disponíveis

### GET /api/leads
- Lista leads da empresa autenticada
- Filtros: status, página, limite
- Retorna: array de leads com paginação

### POST /api/leads
- Cria novo lead (público)
- Payload: dados do formulário + companyId
- Retorna: lead criado

### PUT /api/leads/[id]
- Atualiza status do lead
- Apenas empresa proprietária
- Payload: { status: LeadStatus }

### GET /api/quotes
- Lista orçamentos da empresa
- Filtros: status, página, limite
- Retorna: array de orçamentos com itens

### POST /api/quotes
- Cria novo orçamento
- Payload: dados completos + itens
- Validação automática de totais

### PUT /api/quotes/[id]
- Atualiza orçamento existente
- Suporte a atualização de itens
- Apenas rascunhos podem ser editados livremente

## Melhorias Futuras

### Curto Prazo
- [ ] Envio de orçamentos por email
- [ ] Templates de orçamento
- [ ] Duplicação de orçamentos
- [ ] Histórico de alterações

### Médio Prazo
- [ ] Assinatura digital de orçamentos
- [ ] Integração com sistemas de pagamento
- [ ] Chat em tempo real empresa-cliente
- [ ] Relatórios avançados de vendas

### Longo Prazo
- [ ] IA para sugestão de preços
- [ ] Automação de follow-up
- [ ] Integração com CRM externo
- [ ] App mobile para clientes

## Troubleshooting

### Problemas Comuns
1. **Lead não aparece na lista**: Verificar se empresa está autenticada e lead pertence a ela
2. **Orçamento não salva**: Validar se todos os itens têm preços positivos
3. **Erro de permissão**: Verificar role do usuário (COMPANY vs CUSTOMER)
4. **Notificação não recebida**: Verificar configuração do sistema de notificações

### Logs e Debugging
- Todos os erros são logados no console do servidor
- Validações client-side com mensagens em português
- Estados de loading para melhor UX
- Error boundaries para captura de erros React

## Considerações de Performance

- Paginação implementada em todas as listas
- Índices no banco de dados para queries frequentes
- Lazy loading de itens de orçamento
- Cache de estatísticas no frontend
- Otimização de queries com includes seletivos