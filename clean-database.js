const {
    PrismaClient
} = require('@prisma/client');

async function cleanDatabase() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Conectando ao banco solarconnect...');

        // Verificar conexão
        await prisma.$queryRaw `SELECT 1 as test`;
        console.log('✅ Conectado ao banco solarconnect!');

        // Limpar o schema public
        console.log('🧹 Limpando schema...');
        await prisma.$queryRaw `DROP SCHEMA public CASCADE`;
        await prisma.$queryRaw `CREATE SCHEMA public`;
        await prisma.$queryRaw `GRANT ALL ON SCHEMA public TO postgres`;
        await prisma.$queryRaw `GRANT ALL ON SCHEMA public TO public`;

        console.log('✅ Schema limpo com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();