import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Criar usuário admin
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin SolarConnect',
      email: 'admin@solarconnect.com.br',
      role: 'ADMIN',
    },
  })

  // Criar usuários de exemplo
  const user1 = await prisma.user.create({
    data: {
      name: 'Solar Tech Ltda',
      email: 'contato@solartech.com.br',
      role: 'COMPANY',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Energia Verde SA',
      email: 'info@energiaverde.com.br',
      role: 'COMPANY',
    },
  })

  const user3 = await prisma.user.create({
    data: {
      name: 'Sol Brasileiro',
      email: 'contato@solbrasileiro.com.br',
      role: 'COMPANY',
    },
  })

  // Criar empresas de exemplo
  await prisma.companyProfile.create({
    data: {
      name: 'Solar Tech Soluções',
      slug: 'solar-tech-solucoes',
      description: 'Especializada em sistemas de energia solar residencial e comercial. Mais de 10 anos de experiência no mercado com projetos personalizados e atendimento de qualidade.',
      rating: 4.8,
      verified: true,
      location: 'São Paulo, SP',
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 3000-1000',
      email: 'contato@solartech.com.br',
      website: 'https://solartech.com.br',
      specialties: ['Residencial', 'Comercial', 'Manutenção'],
      certifications: ['INMETRO', 'ABNT NBR 16274'],
      yearsExperience: 10,
      projectsCompleted: 500,
      teamSize: '15-30 funcionários',
      serviceAreas: ['São Paulo', 'Grande São Paulo', 'Interior SP'],
      userId: user1.id,
    },
  })

  await prisma.companyProfile.create({
    data: {
      name: 'Energia Verde Sustentável',
      slug: 'energia-verde-sustentavel',
      description: 'Líder em soluções de energia renovável. Oferecemos consultoria completa e instalação de sistemas fotovoltaicos de alta qualidade com garantia estendida.',
      rating: 4.6,
      verified: true,
      location: 'Campinas, SP',
      city: 'Campinas',
      state: 'SP',
      phone: '(19) 3000-2000',
      email: 'info@energiaverde.com.br',
      specialties: ['Industrial', 'Comercial', 'Consultoria'],
      certifications: ['ISO 9001', 'INMETRO'],
      yearsExperience: 8,
      projectsCompleted: 300,
      teamSize: '10-20 funcionários',
      serviceAreas: ['Campinas', 'Região Metropolitana', 'Interior SP'],
      userId: user2.id,
    },
  })

  await prisma.companyProfile.create({
    data: {
      name: 'Sol Brasileiro',
      slug: 'sol-brasileiro',
      description: 'Empresa nacional focada em democratizar o acesso à energia solar. Atendemos todo o território nacional com qualidade e preço justo.',
      rating: 4.4,
      verified: false,
      location: 'Rio de Janeiro, RJ',
      city: 'Rio de Janeiro',
      state: 'RJ',
      phone: '(21) 3000-3000',
      email: 'contato@solbrasileiro.com.br',
      specialties: ['Residencial', 'Rural'],
      certifications: ['INMETRO'],
      yearsExperience: 5,
      projectsCompleted: 200,
      teamSize: '5-10 funcionários',
      serviceAreas: ['Rio de Janeiro', 'Baixada Fluminense', 'Interior RJ'],
      userId: user3.id,
    },
  })

  console.log('Dados de exemplo criados com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })