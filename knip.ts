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
        // The setup file is referenced by `test/rstest.config.mts`.
        "test/__setup__.ts",
    ],
    ignore: "examples/**",
    ignoreDependencies: [
        "@rstest/coverage-istanbul",
    ],
    // Rstest resolves `setupFiles` from the project root, while Knip's Rstest
    // plugin resolves them from the config file directory. This causes Knip to
    // report `test/__setup__.ts` as unresolved even though Rstest loads it
    // correctly from the root. See: https://knip.dev/reference/configuration#ignoreunresolved
    ignoreUnresolved: [
        "test/__setup__.ts",
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
