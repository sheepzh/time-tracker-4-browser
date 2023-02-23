import optionGenerator from "./webpack.common"
import path from "path"
import FileManagerWebpackPlugin from "filemanager-webpack-plugin"
import webpack from "webpack"

const { name, version } = require(path.join(__dirname, '..', 'package.json'))

const outputDir = path.resolve(__dirname, '..', 'dist_prod')
const option = optionGenerator(outputDir)
option.mode = 'production'

const normalZipFilePath = path.resolve(__dirname, '..', 'market_packages', `${name}-${version}.mv3.zip`)
const sourceCodeForFireFox = path.resolve(__dirname, '..', 'market_packages', `${name}-${version}-src.mv3.zip`)

// Temporary directory for source code to archive on Firefox
const sourceTempDir = path.resolve(__dirname, '..', 'firefox')

const srcDir = ['public', 'src', "test", 'package.json', 'tsconfig.json', 'webpack', 'global.d.ts', "jest.config.ts", "script", ".gitignore"]
const copyMapper = srcDir.map(p => { return { source: path.resolve(__dirname, '..', p), destination: path.resolve(sourceTempDir, p) } })

const readmeForFirefox = path.join(__dirname, '..', 'doc', 'for-fire-fox.md')

const filemanagerWebpackPlugin = new FileManagerWebpackPlugin({
    events: {
        // Archive at the end
        onEnd: [
            { delete: [path.join(outputDir, '*.LICENSE.txt')] },
            // Define plugin to archive zip for different markets
            {
                delete: [normalZipFilePath],
                archive: [{ source: outputDir, destination: normalZipFilePath }]
            },
            // Archive source code for FireFox
            {
                copy: [
                    { source: readmeForFirefox, destination: path.join(sourceTempDir, 'README.md') },
                    { source: readmeForFirefox, destination: path.join(sourceTempDir, 'doc', 'for-fire-fox.md') },
                    ...copyMapper
                ],
                archive: [
                    { source: sourceTempDir, destination: sourceCodeForFireFox },
                ],
                delete: [sourceTempDir]
            }
        ]
    }
})

option.plugins.push(filemanagerWebpackPlugin as webpack.WebpackPluginInstance)

option.output.path = outputDir

export default option