const {
    PrismaClient
} = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
console.log('🌱 Criando dados do marketplace...')

const hashedPassword = await bcrypt.hash('123456', 10)

// Criar usuários para as empresas
name: 'SolarTech Brasil',
    email: 'contato@solartech.com.br',
    description: 'Especialistas em energia solar residencial e comercial com mais de 10 anos de experiência.',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 99999-1111',
    website: 'https://solartech.com.br',
    specialties: ['Residencial', 'Comercial', 'Instalação'],
    yearsExperience: 10,
    projectsCompleted: 250,
    verified: true,
    rating: 4.8
}, {
name: 'EcoSolar Energia',
email: 'info@ecosolar.com.br',
description: 'Soluções sustentáveis em energia solar para residências e empresas.',
city: 'Rio de Janeiro',
state: 'RJ',
phone: '(21) 99999-2222',
website: 'https://ecosolar.com.br',
specialties: ['Sustentabilidade', 'Residencial', 'Consultoria'],
yearsExperience: 8,
projectsCompleted: 180,
verified: true,
rating: 4.6
}, {
name: 'Solar Power MG',
email: 'vendas@solarpowermg.com.br',
description: 'Energia solar de qualidade para Minas Gerais e região.',
city: 'Belo Horizonte',
state: 'MG',
phone: '(31) 99999-3333',
specialties: ['Industrial', 'Comercial', 'Manutenção'],
yearsExperience: 12,
projectsCompleted: 320,
verified: false,
rating: 4.4
}
]

for (const company of companies) {
    try {
        // Verificar se usuário já existe
        const existingUser = await prisma.user.findUnique({
            where: {
                email: company.email
            }
        })

        if (existingUser) {
            console.log(`⚠️  Usuário já existe: ${company.email}`)
            continue
        }

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                name: company.name,
                email: company.email,
                password: hashedPassword,
                role: 'COMPANY',
                status: 'ACTIVE'
            }
        })

        // Criar slug
        const slug = company.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()

        // Criar perfil da empresa
        const companyProfile = await prisma.companyProfile.create({
            data: {
                userId: user.id,
                name: company.name,
                slug: slug,
                description: company.description,
                phone: company.phone,
                email: company.email,
                website: company.website || null,
                address: 'Rua Exemplo, 123',
                city: company.city,
                state: company.state,
                zipCode: '00000-000',
                specialties: company.specialties,
                certifications: ['INMETRO', 'ABNT'],
                yearsExperience: company.yearsExperience,
                projectsCompleted: company.projectsCompleted,
                teamSize: 'MEDIUM',
                serviceAreas: [company.city, company.state],
                verified: company.verified,
                status: 'ACTIVE'
            }
        })

        // Criar algumas avaliações
        const reviewCount = Math.floor(Math.random() * 10) + 5
        for (let i = 0; i < reviewCount; i++) {
            const rating = Math.floor(Math.random() * 2) + 4 // 4 ou 5 estrelas
            await prisma.review.create({
                data: {
                    companyId: companyProfile.id,
                    rating: rating,
                    title: `Excelente serviço ${i + 1}`,
                    comment: 'Muito satisfeito com o atendimento e qualidade da instalação.',
                    customerName: `Cliente ${i + 1}`,
                    customerLocation: `${company.city}, ${company.state}`,
                    projectType: 'RESIDENCIAL',
                    status: 'APPROVED'
                }
            })
        }

        console.log(`✅ Empresa criada: ${company.name}`)
    } catch (error) {
        console.log(`❌ Erro ao criar ${company.name}:`, error.message)
    }
}

console.log('🎉 Dados do marketplace criados com sucesso!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })