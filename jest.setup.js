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
jest.mock('./lib/db', () => ({
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
jest.mock('./lib/uploadthing', () => ({
    ourFileRouter: {},
}))

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3001'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.RESEND_API_KEY = 'test-api-key'

// Global test utilities
global.fetch = jest.fn()

// Mock global Request for Next.js
global.Request = class MockRequest {
    constructor(url, options = {}) {
        this._url = url
        this.method = options.method || 'GET'
        this.headers = new Map(Object.entries(options.headers || {}))
        this._body = options.body
    }

    get url() {
        return this._url
    }

    async json() {
        return JSON.parse(this._body || '{}')
    }

    async text() {
        return this._body || ''
    }
}

global.Response = class MockResponse {
    constructor(body, options = {}) {
        this.body = body
        this.status = options.status || 200
        this.headers = new Map(Object.entries(options.headers || {}))
    }

    static json(data, options = {}) {
        return new MockResponse(JSON.stringify(data), {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        })
    }

    async json() {
        return JSON.parse(this.body)
    }
}

// Mock NextRequest for API routes
jest.mock('next/server', () => ({
    NextRequest: class MockNextRequest {
        constructor(url, options = {}) {
            this._url = url
            this.method = options.method || 'GET'
            this.headers = new Map(Object.entries(options.headers || {}))
            this._body = options.body
        }

        get url() {
            return this._url
        }

        async json() {
            return JSON.parse(this._body || '{}')
        }

        async text() {
            return this._body || ''
        }
    },
    NextResponse: {
        json: (data, options = {}) => ({
            json: async () => data,
            status: options.status || 200,
            headers: new Map(Object.entries(options.headers || {}))
        })
    }
}))

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks()
})