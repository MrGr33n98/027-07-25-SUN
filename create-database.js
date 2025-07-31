const {
    PrismaClient
} = require('@prisma/client');

async function createDatabase() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Conectando ao PostgreSQL...');

        // Verificar conexão
        await prisma.$queryRaw `SELECT 1 as test`;
        console.log('✅ Conectado ao PostgreSQL!');

        // Tentar criar o banco solarconnect
        try {
            await prisma.$queryRaw `CREATE DATABASE solarconnect`;
            console.log('✅ Banco "solarconnect" criado com sucesso!');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('ℹ️  Banco "solarconnect" já existe');
            } else {
                console.error('❌ Erro ao criar banco:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createDatabase();