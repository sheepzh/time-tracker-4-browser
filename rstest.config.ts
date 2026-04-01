
import { defineConfig } from '@rstest/core'

export default defineConfig({
    testTimeout: 50000,
    testEnvironment: 'jsdom',
    globals: true,
    setupFiles: ['./test-e2e/setup.ts'],
})
