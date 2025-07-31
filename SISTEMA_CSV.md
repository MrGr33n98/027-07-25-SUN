# Sistema de Importação/Exportação CSV - SolarConnect

## Visão Geral

O sistema CSV permite que administradores gerenciem empresas em lote através de arquivos CSV, facilitando:
- Importação de múltiplas empresas de uma vez
- Exportação de dados existentes para backup ou análise
- Download de template padronizado para facilitar o preenchimento

## Localização dos Arquivos

### APIs
- [`/api/admin/companies/preview-csv`](app/api/admin/companies/preview-csv/route.ts) - Preview dos dados CSV antes da importação
- [`/api/admin/companies/import-csv`](app/api/admin/companies/import-csv/route.ts) - Importação definitiva dos dados
- [`/api/admin/companies/export-csv`](app/api/admin/companies/export-csv/route.ts) - Exportação de empresas existentes
- [`/api/admin/companies/template-csv`](app/api/admin/companies/template-csv/route.ts) - Download do template CSV

### Interface
- [`/admin/empresas/importar`](app/admin/empresas/importar/page.tsx) - Página de administração CSV
- [`CompanyImportManager`](components/admin/company-import-manager.tsx) - Componente principal do sistema

## Funcionalidades

### 1. Download de Template
- Gera arquivo CSV com formato correto
- Inclui instruções detalhadas como comentários
- Contém exemplo preenchido para referência
- Arquivo: `template_empresas_solarconnect.csv`

### 2. Importação CSV
**Processo em 3 etapas:**

#### Etapa 1: Upload
- Drag & drop ou seleção manual de arquivo
- Validação de formato (.csv)
- Limite de 10MB por arquivo

#### Etapa 2: Preview
- Validação dos dados antes da importação
- Estatísticas de registros válidos/inválidos
- Lista de erros encontrados
- Preview das primeiras 5 linhas
- Possibilidade de cancelar antes da importação

#### Etapa 3: Importação
- Processamento definitivo dos dados
- Criação de usuários e perfis de empresa
- Relatório final com sucessos e falhas
- Opção de nova importação

### 3. Exportação CSV
- Exporta todas as empresas cadastradas
- Inclui dados completos dos perfis
- Nome do arquivo com data: `empresas_YYYY-MM-DD.csv`
- Download automático via navegador

## Formato do CSV

### Campos Obrigatórios
- `nome` - Nome da empresa
- `email` - Email de login (deve ser único)
- `descricao` - Descrição da empresa

### Campos Opcionais
- `telefone` - Telefone de contato
- `cidade` - Cidade sede
- `estado` - Estado (sigla)
- `website` - Site da empresa
- `whatsapp` - Número WhatsApp
- `instagram` - Perfil Instagram
- `linkedin` - Perfil LinkedIn
- `especialidades` - Lista separada por vírgulas
- `anos_experiencia` - Número de anos (inteiro)
- `tamanho_equipe` - Tamanho da equipe
- `areas_atendimento` - Lista separada por vírgulas

### Exemplo de Linha CSV
```csv
nome,email,descricao,telefone,cidade,estado,website,whatsapp,instagram,linkedin,especialidades,anos_experiencia,tamanho_equipe,areas_atendimento
"Solar Tech Ltda","contato@solartech.com.br","Empresa especializada em instalação de painéis solares","(11) 99999-9999","São Paulo","SP","https://www.solartech.com.br","5511999999999","@solartech_oficial","linkedin.com/company/solartech","Instalação Residencial, Sistemas Comerciais","5","Pequena (1-10)","São Paulo, ABC Paulista"
```

## Validações

### Validações de Formato
- Email deve ter formato válido
- Anos de experiência deve ser número
- Campos obrigatórios não podem estar vazios
- Especialidades e áreas são arrays separados por vírgula

### Validações de Negócio
- Email não pode estar duplicado no sistema
- Nome da empresa deve ter pelo menos 2 caracteres
- Descrição deve ter pelo menos 10 caracteres

### Tratamento de Erros
- Linhas inválidas são ignoradas na importação
- Relatório detalhado de erros por linha
- Sistema não para por causa de erros individuais

## Segurança

### Controle de Acesso
- Apenas usuários com role `ADMIN` podem acessar
- Verificação de sessão em todas as APIs
- Validação de autenticação via NextAuth

### Validação de Arquivos
- Apenas arquivos CSV são aceitos
- Limite de tamanho de 10MB
- Validação de conteúdo antes do processamento

## Uso Prático

### Para Importar Empresas
1. Acesse `/admin/empresas/importar`
2. Clique em "Baixar Template"
3. Preencha o CSV com os dados das empresas
4. Remova as linhas de comentário do template
5. Faça upload do arquivo
6. Revise o preview dos dados
7. Confirme a importação

### Para Exportar Dados
1. Acesse `/admin/empresas/importar`
2. Clique em "Exportar Empresas"
3. O arquivo será baixado automaticamente

## Limitações Atuais

- Não suporta atualização de empresas existentes (apenas criação)
- Não permite upload de imagens via CSV
- Campos de relacionamento (produtos, projetos) não são importados
- Senhas são geradas automaticamente (não personalizáveis via CSV)

## Melhorias Futuras

- [ ] Suporte a atualização de empresas existentes
- [ ] Importação de produtos e projetos
- [ ] Upload de imagens referenciadas no CSV
- [ ] Agendamento de importações automáticas
- [ ] Histórico de importações/exportações
- [ ] Validação de dados em tempo real durante upload

## Logs e Monitoramento

Todos os erros são logados no console do servidor para debugging:
- Erros de validação CSV
- Falhas na criação de usuários/empresas
- Problemas de banco de dados
- Erros de processamento de arquivos