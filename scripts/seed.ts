import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Clean existing data
  await prisma.review.deleteMany()
  await prisma.project.deleteMany()
  await prisma.product.deleteMany()
  await prisma.companyProfile.deleteMany()
  await prisma.user.deleteMany()

  // Create users and companies
  const companies = [
    {
      name: 'João Silva',
      email: 'contato@solartech.com.br',
      company: {
        name: 'SolarTech Brasil',
        slug: 'solar-tech-brasil',
        description: 'Especialistas em energia solar residencial e comercial com mais de 10 anos de experiência no mercado. Oferecemos soluções completas desde o projeto até a instalação e manutenção.',
        city: 'São Paulo',
        state: 'SP',
        phone: '(11) 99999-1111',
        specialties: ['residencial', 'comercial', 'instalacao', 'manutencao'],
        yearsExperience: 10,
        projectsCompleted: 250,
        verified: true,
      }
    },
    {
      name: 'Maria Santos',
      email: 'info@ecosolar.com.br',
      company: {
        name: 'EcoSolar Energia',
        slug: 'ecosolar-energia',
        description: 'Soluções sustentáveis em energia solar para residências e empresas. Focamos em tecnologia de ponta e atendimento personalizado para cada cliente.',
        city: 'Rio de Janeiro',
        state: 'RJ',
        phone: '(21) 99999-2222',
        specialties: ['residencial', 'consultoria', 'projeto', 'financiamento'],
        yearsExperience: 8,
        projectsCompleted: 180,
        verified: true,
      }
    },
    {
      name: 'Pedro Costa',
      email: 'vendas@solarpowermg.com.br',
      company: {
        name: 'Solar Power MG',
        slug: 'solar-power-mg',
        description: 'Energia solar de qualidade para Minas Gerais e região. Atendemos projetos residenciais, comerciais e industriais com as melhores marcas do mercado.',
        city: 'Belo Horizonte',
        state: 'MG',
        phone: '(31) 99999-3333',
        specialties: ['industrial', 'comercial', 'manutencao', 'projeto'],
        yearsExperience: 12,
        projectsCompleted: 320,
        verified: false,
      }
    },
    {
      name: 'Ana Oliveira',
      email: 'contato@ruralsolar.com.br',
      company: {
        name: 'Rural Solar',
        slug: 'rural-solar',
        description: 'Especialistas em energia solar para propriedades rurais e agronegócio. Entendemos as necessidades específicas do campo e oferecemos soluções robustas.',
        city: 'Goiânia',
        state: 'GO',
        phone: '(62) 99999-4444',
        specialties: ['rural', 'agronegocio', 'projeto', 'financiamento'],
        yearsExperience: 6,
        projectsCompleted: 95,
        verified: true,
      }
    },
    {
      name: 'Carlos Mendes',
      email: 'info@eletrosolar.com.br',
      company: {
        name: 'EletroSolar Postos',
        slug: 'eletrosolar-postos',
        description: 'Soluções inovadoras em energia solar para eletropostos e carregadores de veículos elétricos. Pioneiros no segmento de mobilidade elétrica sustentável.',
        city: 'Curitiba',
        state: 'PR',
        phone: '(41) 99999-5555',
        specialties: ['eletroposto', 'comercial', 'homologacao', 'inovacao'],
        yearsExperience: 5,
        projectsCompleted: 45,
        verified: true,
      }
    }
  ]

  const hashedPassword = await hash('123456789', 12)

  for (const companyData of companies) {
    const user = await prisma.user.create({
      data: {
        name: companyData.name,
        email: companyData.email,
        passwordHash: hashedPassword,
        role: 'COMPANY',
        emailVerified: new Date(),
      }
    })

    const company = await prisma.companyProfile.create({
      data: {
        ...companyData.company,
        userId: user.id,
        email: companyData.email,
        rating: Math.random() * 1.5 + 3.5, // Between 3.5 and 5.0
        reviewCount: Math.floor(Math.random() * 30) + 5, // Between 5 and 35
      }
    })

    console.log(`✅ Criada empresa: ${company.name}`)

    // Create products for each company
    const productCategories = ['PAINEL_SOLAR', 'INVERSOR', 'BATERIA', 'KIT_COMPLETO']
    const productsPerCompany = Math.floor(Math.random() * 3) + 2 // 2-4 products per company

    for (let i = 0; i < productsPerCompany; i++) {
      const category = productCategories[Math.floor(Math.random() * productCategories.length)]
      const basePrice = Math.floor(Math.random() * 5000) + 1000 // R$ 1000-6000
      
      await prisma.product.create({
        data: {
          name: `${category.replace('_', ' ')} Premium ${i + 1}`,
          description: `Produto de alta qualidade para sistemas de energia solar. Ideal para projetos ${companyData.company.specialties[0]}.`,
          price: basePrice,
          originalPrice: basePrice * 1.2,
          power: category === 'PAINEL_SOLAR' ? Math.floor(Math.random() * 400) + 100 : undefined,
          efficiency: category === 'PAINEL_SOLAR' ? Math.random() * 5 + 18 : undefined,
          warranty: Math.floor(Math.random() * 10) + 10, // 10-20 years
          category: category as any,
          brand: ['Canadian Solar', 'Growatt', 'WEG', 'BYD'][Math.floor(Math.random() * 4)],
          images: ['/placeholder-product.jpg'],
          status: 'APPROVED',
          companyId: company.id,
        }
      })
    }

    // Create projects for each company
    const projectsPerCompany = Math.floor(Math.random() * 3) + 1 // 1-3 projects per company

    for (let i = 0; i < projectsPerCompany; i++) {
      const projectTypes = ['RESIDENCIAL', 'COMERCIAL', 'INDUSTRIAL', 'RURAL']
      const projectType = companyData.company.specialties.includes('residencial') ? 'RESIDENCIAL' :
                         companyData.company.specialties.includes('comercial') ? 'COMERCIAL' :
                         companyData.company.specialties.includes('industrial') ? 'INDUSTRIAL' :
                         companyData.company.specialties.includes('rural') ? 'RURAL' :
                         projectTypes[Math.floor(Math.random() * projectTypes.length)]

      await prisma.project.create({
        data: {
          title: `Projeto ${projectType} ${i + 1} - ${companyData.company.city}`,
          description: `Sistema de energia solar ${projectType.toLowerCase()} instalado com sucesso. Projeto completo incluindo dimensionamento, instalação e comissionamento.`,
          location: `${companyData.company.city}, ${companyData.company.state}`,
          power: Math.random() * 50 + 10, // 10-60 kWp
          completionDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in the last year
          projectType: projectType as any,
          client: `Cliente ${i + 1}`,
          duration: `${Math.floor(Math.random() * 30) + 15} dias`,
          images: ['/placeholder-project.jpg'],
          status: 'APPROVED',
          companyId: company.id,
        }
      })
    }

    // Create reviews for each company
    const reviewsPerCompany = Math.floor(Math.random() * 8) + 3 // 3-10 reviews per company

    for (let i = 0; i < reviewsPerCompany; i++) {
      const rating = Math.floor(Math.random() * 2) + 4 // 4 or 5 stars mostly
      const customerNames = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Mendes', 'Lucas Ferreira', 'Juliana Lima', 'Roberto Alves']
      const cities = [`${companyData.company.city}`, 'Cidade Vizinha', 'Interior', 'Capital']

      await prisma.review.create({
        data: {
          rating: rating,
          title: rating >= 4 ? 'Excelente serviço!' : 'Bom atendimento',
          comment: rating >= 4 
            ? 'Empresa muito profissional, cumpriu todos os prazos e o sistema está funcionando perfeitamente. Recomendo!'
            : 'Serviço adequado, alguns pontos poderiam melhorar mas no geral ficou bom.',
          customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
          customerLocation: `${cities[Math.floor(Math.random() * cities.length)]}, ${companyData.company.state}`,
          projectType: 'Sistema Residencial',
          installationDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Random date in the last 6 months
          verified: Math.random() > 0.3, // 70% verified
          helpful: Math.floor(Math.random() * 10),
          status: 'APPROVED',
          companyId: company.id,
        }
      })
    }
  }

  // Create some regular customers
  const customers = [
    { name: 'Cliente Exemplo 1', email: 'cliente1@email.com' },
    { name: 'Cliente Exemplo 2', email: 'cliente2@email.com' },
    { name: 'Cliente Exemplo 3', email: 'cliente3@email.com' },
  ]

  for (const customer of customers) {
    await prisma.user.create({
      data: {
        name: customer.name,
        email: customer.email,
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
        emailVerified: new Date(),
      }
    })
    console.log(`✅ Criado cliente: ${customer.name}`)
  }

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@solarconnect.com.br',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    }
  })
  console.log(`✅ Criado administrador: ${adminUser.name}`)

  console.log('🎉 Seed concluído com sucesso!')
  console.log('📊 Dados criados:')
  console.log(`   - ${companies.length} empresas`)
  console.log(`   - ${customers.length} clientes`)
  console.log(`   - 1 administrador`)
  console.log('   - Produtos, projetos e avaliações para cada empresa')
  console.log('')
  console.log('🔑 Credenciais de teste:')
  console.log('   📋 DASHBOARD EMPRESA:')
  console.log('      Email: contato@solartech.com.br')
  console.log('      Senha: 123456789')
  console.log('')
  console.log('   🔧 PAINEL ADMIN:')
  console.log('      Email: admin@solarconnect.com.br')
  console.log('      Senha: 123456789')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })