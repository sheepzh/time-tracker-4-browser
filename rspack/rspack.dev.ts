import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin"
import path from "path"
import manifest from "../src/manifest"
import generateOption from "./rspack.common"

manifest.name = "IS DEV"

const options = generateOption({
    outputPath: path.join(__dirname, '..', 'dist_dev'),
    manifest,
    mode: "development",
})

const tsCheckerPlugin = new ForkTsCheckerWebpackPlugin({
    typescript: {
        configOverwrite: {
            compilerOptions: {
                skipLibCheck: false,
            },
        },
        diagnosticOptions: {
            syntactic: true,
            semantic: true,
            declaration: true,
            global: true,
        },
    },
    issue: {
        exclude: [
            { file: '**/node_modules/**' },
        ],
    },
})

options.plugins?.push(tsCheckerPlugin)

export default options
