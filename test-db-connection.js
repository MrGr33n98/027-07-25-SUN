const {
    PrismaClient
} = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Testando conexão com o banco de dados...');

        // Teste simples de conexão
        await prisma.$queryRaw `SELECT 1 as test`;
        console.log('✅ Conexão com o banco estabelecida com sucesso!');

        // Verificar se existem usuários
        const userCount = await prisma.user.count();
        console.log(`👥 Usuários no banco: ${userCount}`);

        if (userCount > 0) {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                }
            });

            console.log('📋 Usuários encontrados:');
            users.forEach(user => {
                console.log(`  - ${user.email} (${user.role}) - ${user.name}`);
            });
        }

    } catch (error) {
        console.error('❌ Erro ao conectar com o banco:', error.message);

        if (error.message.includes("Can't reach database server")) {
            console.log('\n🔧 Possíveis soluções:');
            console.log('1. Verificar se o PostgreSQL está rodando');
            console.log('2. Verificar a porta correta (5432, 5433, 5434)');
            console.log('3. Verificar as credenciais (usuário/senha)');
            console.log('4. Verificar se o banco "solarconnect" existe');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();