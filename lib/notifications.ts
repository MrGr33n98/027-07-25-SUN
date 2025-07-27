import { prisma } from '@/lib/prisma'

export type NotificationType = 
  | 'LEAD_RECEIVED'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'PROJECT_APPROVED'
  | 'PROJECT_REJECTED'
  | 'REVIEW_RECEIVED'
  | 'MESSAGE_RECEIVED'
  | 'SYSTEM_UPDATE'

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: NotificationType
  data?: any
}

export async function createNotification({
  userId,
  title,
  message,
  type,
  data
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: data || null,
      }
    })
    
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function createLeadNotification(companyUserId: string, leadData: any) {
  return createNotification({
    userId: companyUserId,
    title: 'Novo lead recebido!',
    message: `${leadData.name} está interessado em seus serviços para um projeto ${leadData.projectType}`,
    type: 'LEAD_RECEIVED',
    data: { leadId: leadData.id }
  })
}

export async function createProductModerationNotification(
  companyUserId: string, 
  productName: string, 
  approved: boolean,
  reason?: string
) {
  return createNotification({
    userId: companyUserId,
    title: approved ? 'Produto aprovado!' : 'Produto rejeitado',
    message: approved 
      ? `Seu produto "${productName}" foi aprovado e está disponível no marketplace`
      : `Seu produto "${productName}" foi rejeitado. ${reason ? `Motivo: ${reason}` : ''}`,
    type: approved ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
    data: { productName, reason }
  })
}

export async function createProjectModerationNotification(
  companyUserId: string, 
  projectTitle: string, 
  approved: boolean,
  reason?: string
) {
  return createNotification({
    userId: companyUserId,
    title: approved ? 'Projeto aprovado!' : 'Projeto rejeitado',
    message: approved 
      ? `Seu projeto "${projectTitle}" foi aprovado e está visível no seu portfólio`
      : `Seu projeto "${projectTitle}" foi rejeitado. ${reason ? `Motivo: ${reason}` : ''}`,
    type: approved ? 'PROJECT_APPROVED' : 'PROJECT_REJECTED',
    data: { projectTitle, reason }
  })
}

export async function createReviewNotification(companyUserId: string, reviewData: any) {
  return createNotification({
    userId: companyUserId,
    title: 'Nova avaliação recebida!',
    message: `${reviewData.customerName} avaliou sua empresa com ${reviewData.rating} estrelas`,
    type: 'REVIEW_RECEIVED',
    data: { 
      reviewId: reviewData.id,
      rating: reviewData.rating,
      customerName: reviewData.customerName
    }
  })
}