import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
    }),
    useSearchParams: () => ({
        get: jest.fn(),
    }),
    usePathname: () => '/test-path',
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
    useSession: () => ({
        data: null,
        status: 'unauthenticated',
    }),
    signIn: jest.fn(),
    signOut: jest.fn(),
    SessionProvider: ({
        children
    }) => children,
}))

// Mock Resend
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: {
            send: jest.fn().mockResolvedValue({
                id: 'test-email-id'
            }),
        },
    })),
}))

// Mock Prisma
jest.mock('@/lib/db', () => ({
    db: {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        companyProfile: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        lead: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        quote: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        notification: {
            create: jest.fn(),
        },
    },
}))

// Mock uploadthing
jest.mock('@/lib/uploadthing', () => ({
    ourFileRouter: {},
}))

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3001'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.RESEND_API_KEY = 'test-api-key'

// Global test utilities
global.fetch = jest.fn()

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks()
})