const nextJest = require('next/jest')

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.(ts|tsx|js)',
        '**/*.(test|spec).(ts|tsx|js)'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@auth/prisma-adapter)/)',
    ],
    collectCoverageFrom: [
        'lib/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
    // Use different test environments based on file patterns
    projects: [{
            displayName: 'jsdom',
            testEnvironment: 'jsdom',
            testMatch: [
                '**/__tests__/components/**/*.(ts|tsx)',
                '**/__tests__/app/**/*.(ts|tsx)',
                '**/__tests__/integration/**/*.(ts|tsx)',
            ],
            setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/$1',
            },
        },
        {
            displayName: 'node',
            testEnvironment: 'node',
            testMatch: [
                '**/__tests__/lib/**/*.(ts|tsx)',
                '**/__tests__/api/**/*.(ts|tsx)',
            ],
            setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/$1',
            },
            transformIgnorePatterns: [
                'node_modules/(?!(@auth/prisma-adapter)/)',
            ],
        },
    ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)