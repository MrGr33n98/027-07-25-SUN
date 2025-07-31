import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailData {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, from, replyTo }: EmailData) {
  try {
    const result = await resend.emails.send({
      from: from || 'SolarConnect <noreply@solarconnect.com.br>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    })

    console.log('Email sent successfully:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Template base para emails
export function createEmailTemplate({
  title,
  content,
  ctaText,
  ctaUrl,
  footerText = 'Este email foi enviado pelo SolarConnect'
}: {
  title: string
  content: string
  ctaText?: string
  ctaUrl?: string
  footerText?: string
}) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .email-container {
          background-color: white;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f97316;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #f97316;
          margin-bottom: 10px;
        }
        .tagline {
          color: #666;
          font-size: 14px;
        }
        h1 {
          color: #333;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .content {
          margin-bottom: 30px;
        }
        .cta-button {
          display: inline-block;
          background-color: #f97316;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          text-align: center;
          margin: 20px 0;
        }
        .cta-button:hover {
          background-color: #ea580c;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .social-links {
          margin: 15px 0;
        }
        .social-links a {
          color: #f97316;
          text-decoration: none;
          margin: 0 10px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">☀️ SolarConnect</div>
          <div class="tagline">Conectando você à energia solar</div>
        </div>
        
        <h1>${title}</h1>
        
        <div class="content">
          ${content}
        </div>
        
        ${ctaText && ctaUrl ? `
          <div style="text-align: center;">
            <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>${footerText}</p>
          <div class="social-links">
            <a href="https://solarconnect.com.br">Site</a> |
            <a href="mailto:contato@solarconnect.com.br">Contato</a> |
            <a href="https://solarconnect.com.br/suporte">Suporte</a>
          </div>
          <p style="margin-top: 15px;">
            <small>SolarConnect - Marketplace de Energia Solar<br>
            São Paulo, Brasil</small>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template para novos leads
export function createNewLeadEmailTemplate({
  companyName,
  leadName,
  leadEmail,
  leadPhone,
  projectType,
  location,
  budget,
  message,
  dashboardUrl
}: {
  companyName: string
  leadName: string
  leadEmail: string
  leadPhone: string
  projectType: string
  location: string
  budget?: string
  message: string
  dashboardUrl: string
}) {
  const content = `
    <p>Você recebeu uma nova solicitação de orçamento!</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #f97316;">Dados do Cliente</h3>
      <p><strong>Nome:</strong> ${leadName}</p>
      <p><strong>Email:</strong> <a href="mailto:${leadEmail}">${leadEmail}</a></p>
      <p><strong>Telefone:</strong> <a href="tel:${leadPhone}">${leadPhone}</a></p>
      <p><strong>Localização:</strong> ${location}</p>
      <p><strong>Tipo de Projeto:</strong> ${projectType}</p>
      ${budget ? `<p><strong>Orçamento:</strong> ${budget}</p>` : ''}
    </div>
    
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #856404;">Mensagem do Cliente</h3>
      <p style="font-style: italic;">${message}</p>
    </div>
    
    <p>Entre em contato com o cliente o mais rápido possível para aumentar suas chances de conversão!</p>
  `

  return createEmailTemplate({
    title: `Novo Lead para ${companyName}`,
    content,
    ctaText: 'Ver no Dashboard',
    ctaUrl: dashboardUrl
  })
}

// Template para orçamento enviado
export function createQuoteEmailTemplate({
  customerName,
  companyName,
  companyLogo,
  quoteTitle,
  totalValue,
  validUntil,
  items,
  terms,
  quoteUrl
}: {
  customerName: string
  companyName: string
  companyLogo?: string
  quoteTitle: string
  totalValue: number
  validUntil: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  terms?: string
  quoteUrl: string
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${formatCurrency(item.totalPrice)}</td>
    </tr>
  `).join('')

  const content = `
    <p>Olá <strong>${customerName}</strong>,</p>
    
    <p>A <strong>${companyName}</strong> preparou um orçamento personalizado para você!</p>
    
    ${companyLogo ? `
      <div style="text-align: center; margin: 20px 0;">
        <img src="${companyLogo}" alt="${companyName}" style="max-height: 80px;">
      </div>
    ` : ''}
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #f97316;">${quoteTitle}</h3>
      <p><strong>Válido até:</strong> ${formatDate(validUntil)}</p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f97316; color: white;">
          <th style="padding: 12px; text-align: left;">Item</th>
          <th style="padding: 12px; text-align: center;">Qtd</th>
          <th style="padding: 12px; text-align: right;">Preço Unit.</th>
          <th style="padding: 12px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr style="background-color: #f8f9fa; font-weight: bold;">
          <td colspan="3" style="padding: 15px; text-align: right;">TOTAL GERAL:</td>
          <td style="padding: 15px; text-align: right; color: #f97316; font-size: 18px;">${formatCurrency(totalValue)}</td>
        </tr>
      </tbody>
    </table>
    
    ${terms ? `
      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1976d2;">Termos e Condições</h3>
        <p style="font-size: 14px; white-space: pre-line;">${terms}</p>
      </div>
    ` : ''}
    
    <p>Clique no botão abaixo para visualizar o orçamento completo e entrar em contato conosco:</p>
  `

  return createEmailTemplate({
    title: `Orçamento de ${companyName}`,
    content,
    ctaText: 'Visualizar Orçamento Completo',
    ctaUrl: quoteUrl,
    footerText: `Orçamento enviado por ${companyName} através do SolarConnect`
  })
}

// Template para confirmação de lead
export function createLeadConfirmationEmailTemplate({
  customerName,
  companyName,
  projectType,
  message
}: {
  customerName: string
  companyName: string
  projectType: string
  message: string
}) {
  const content = `
    <p>Olá <strong>${customerName}</strong>,</p>
    
    <p>Recebemos sua solicitação de orçamento para <strong>${companyName}</strong> e queremos confirmar que ela foi enviada com sucesso!</p>
    
    <div style="background-color: #d4edda; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745;">
      <h3 style="margin-top: 0; color: #155724;">✅ Solicitação Confirmada</h3>
      <p><strong>Empresa:</strong> ${companyName}</p>
      <p><strong>Tipo de Projeto:</strong> ${projectType}</p>
      <p><strong>Sua mensagem:</strong></p>
      <p style="font-style: italic; background-color: white; padding: 15px; border-radius: 4px;">${message}</p>
    </div>
    
    <p>A empresa entrará em contato com você em breve através dos dados fornecidos. Enquanto isso, você pode:</p>
    
    <ul>
      <li>Explorar mais empresas no SolarConnect</li>
      <li>Ler nosso guia sobre energia solar</li>
      <li>Calcular sua economia com energia solar</li>
    </ul>
    
    <p>Obrigado por escolher o SolarConnect!</p>
  `

  return createEmailTemplate({
    title: 'Solicitação de Orçamento Confirmada',
    content,
    ctaText: 'Explorar Mais Empresas',
    ctaUrl: 'https://solarconnect.com.br/marketplace'
  })
}

// Template para reset de senha
export function createPasswordResetEmailTemplate({
  userName,
  resetUrl,
  expiresIn = '1 hora'
}: {
  userName: string
  resetUrl: string
  expiresIn?: string
}) {
  const content = `
    <p>Olá <strong>${userName}</strong>,</p>
    
    <p>Recebemos uma solicitação para redefinir a senha da sua conta no SolarConnect.</p>
    
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h3 style="margin-top: 0; color: #856404;">🔒 Redefinição de Senha</h3>
      <p>Se você solicitou essa alteração, clique no botão abaixo para criar uma nova senha:</p>
    </div>
    
    <p><strong>⏰ Este link expira em ${expiresIn}.</strong></p>
    
    <p>Se você não solicitou a redefinição de senha, pode ignorar este email com segurança. Sua senha atual continuará funcionando normalmente.</p>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>Dica de segurança:</strong> Nunca compartilhe sua senha e use uma senha forte com letras, números e símbolos.
      </p>
    </div>
  `

  return createEmailTemplate({
    title: 'Redefinir Senha - SolarConnect',
    content,
    ctaText: 'Redefinir Senha',
    ctaUrl: resetUrl
  })
}