const {
    PrismaClient
} = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleMessages() {
    try {
        // Get some users
        const users = await prisma.user.findMany({
            take: 3
        })

        if (users.length === 0) {
            console.log('No users found. Please create users first.')
            return
        }

        const admin = users.find(u => u.role === 'ADMIN')
        const company = users.find(u => u.role === 'COMPANY')
        const customer = users.find(u => u.role === 'CUSTOMER')

        // Create sample support messages
        const messages = [{
                subject: 'Problema com cadastro de produto',
                content: 'Olá, estou tentando cadastrar um novo produto no meu dashboard mas está dando erro. Poderiam me ajudar?',
                status: 'OPEN',
                priority: 'MEDIUM',
                senderId: company ? company.id : users[0].id,
                recipientId: admin ? admin.id : null,
            },
            {
                subject: 'Dúvida sobre verificação da empresa',
                content: 'Enviei os documentos para verificação da minha empresa há uma semana. Quando será aprovado?',
                status: 'IN_PROGRESS',
                priority: 'HIGH',
                senderId: company ? company.id : users[0].id,
                recipientId: admin ? admin.id : null,
            },
            {
                subject: 'Como funciona o sistema de avaliações?',
                content: 'Gostaria de entender melhor como funciona o sistema de avaliações da plataforma.',
                status: 'RESOLVED',
                priority: 'LOW',
                senderId: customer ? customer.id : users[1].id,
                recipientId: admin ? admin.id : null,
            },
            {
                subject: 'Erro no pagamento da assinatura',
                content: 'Tentei renovar minha assinatura premium mas o pagamento não foi processado. Preciso de ajuda urgente!',
                status: 'OPEN',
                priority: 'URGENT',
                senderId: company ? company.id : users[0].id,
                recipientId: admin ? admin.id : null,
            },
            {
                subject: 'Sugestão de melhoria',
                content: 'Tenho algumas sugestões para melhorar a experiência do usuário na plataforma. Gostariam de ouvir?',
                status: 'CLOSED',
                priority: 'LOW',
                senderId: customer ? customer.id : users[1].id,
                recipientId: admin ? admin.id : null,
            }
        ]

        for (const messageData of messages) {
            const message = await prisma.supportMessage.create({
                data: messageData
            })

            // Add some replies to some messages
            if (messageData.status === 'IN_PROGRESS' || messageData.status === 'RESOLVED') {
                await prisma.supportMessageReply.create({
                    data: {
                        content: messageData.status === 'IN_PROGRESS' ?
                            'Obrigado pelo contato! Estamos analisando sua solicitação e retornaremos em breve.' :
                            'Problema resolvido! Obrigado por usar nossa plataforma.',
                        senderId: admin ? admin.id : users[2].id,
                        messageId: message.id,
                    }
                })

                if (messageData.status === 'RESOLVED') {
                    await prisma.supportMessageReply.create({
                        data: {
                            content: 'Perfeito! Muito obrigado pela ajuda rápida.',
                            senderId: messageData.senderId,
                            messageId: message.id,
                        }
                    })
                }
            }
        }

        console.log('✅ Sample support messages created successfully!')
        console.log(`Created ${messages.length} messages with replies`)

    } catch (error) {
        console.error('Error creating sample messages:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createSampleMessages()