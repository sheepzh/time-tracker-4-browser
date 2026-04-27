import type { KnipConfig } from "knip"
const config: KnipConfig = {
    entry: [
        "src/background/index.ts",
        "src/pages/app/index.ts",
        "src/pages/popup/{index,skeleton}.ts",
        "src/pages/side/index.ts",
        "src/content-script/index.ts",
        "src/content-script/limit/modal/index.ts",
        "script/user-chart/{add,render}.ts",
        "examples/gist/mock-server.ts",
        "examples/notification/demo-server.ts",
    ],
    ignoreDependencies: [
        "@rstest/coverage-istanbul",
        "tsconfig-paths",
    ],
    rspack: {
        config: ["rspack/rspack.{dev,prod,e2e,analyze}*.ts"],
    },
    rstest: {
        config: [
            "test/rstest.config.mts",
            "test-e2e/rstest.config.mts",
        ]
    },
    commitlint: {
        config: [
            ".commitlintrc.ts",
        ]
    }
}

export default config