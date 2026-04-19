import { defineConfig } from '@rstest/core'

export default defineConfig({
    include: ['test-e2e/**/*.test.ts'],
    testEnvironment: 'node',
    globals: true,
    isolate: false,
    hookTimeout: 120_000,
    testTimeout: 60_000,
    pool: {
        maxWorkers: 1,
    },
})
