import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Connection pool configuration for optimal performance
const connectionPoolConfig = {
  // Connection pool settings
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Logging configuration for performance monitoring
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error'] as const
    : ['warn', 'error'] as const,
  // Error formatting for better debugging
  errorFormat: 'pretty' as const,
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(connectionPoolConfig)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Connection pool monitoring
export const getConnectionPoolStatus = () => {
  return {
    // Note: Prisma doesn't expose direct pool metrics, but we can monitor through logs
    isConnected: db ? true : false,
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
  }
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await db.$disconnect()
})