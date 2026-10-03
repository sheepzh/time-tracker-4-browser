import type { KnipConfig } from "knip"
const config: KnipConfig = {
    entry: [
        "script/user-chart/{add,render}.ts",
    ],
    ignore: "examples/**",
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
