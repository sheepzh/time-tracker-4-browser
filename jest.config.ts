import type { Config } from "jest"

const config: Config = {
    projects: [
        '<rootDir>/packages/background/jest.config.ts',
        '<rootDir>/packages/shared/jest.config.ts',
    ],
    testPathIgnorePatterns: [
        'test-e2e',
    ],
}

export default config