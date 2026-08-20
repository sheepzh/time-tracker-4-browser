import { defineConfig } from '@rstest/core'

export default defineConfig({
    include: ['test/**/*.test.ts'],
    setupFiles: ['fake-indexeddb/auto', 'test/__setup__.ts'],
    testEnvironment: 'jsdom',
    globals: true,
})
