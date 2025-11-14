import path from "path"
import manifestFirefox from "../src/manifest-firefox"
import { FileManagerPlugin } from "./plugins/file-manager"
import optionGenerator from "./rspack.common"

const { name, version } = require(path.join(__dirname, '..', 'package.json'))

const outputPath = path.resolve(__dirname, '..', 'dist_prod_firefox')
const marketPkgPath = path.resolve(__dirname, '..', 'market_packages')

const normalZipFilePath = path.resolve(marketPkgPath, `${name}-${version}.firefox.zip`)
const targetZipFilePath = path.resolve(marketPkgPath, 'target.firefox.zip')
const normalSourceCodePath = path.resolve(__dirname, '..', 'market_packages', `${name}-${version}-src.zip`)
const targetSourceCodePath = path.resolve(__dirname, '..', 'market_packages', 'target.src.zip')
const readmeForFirefox = path.join(__dirname, '..', 'doc', 'for-firefox.md')
// Temporary directory for source code to archive on Firefox
const sourceTempDir = path.resolve(__dirname, '..', 'source_temp')
const srcDir = [
    'public',
    'src',
    'test', 'types',
    'package.json', 'package-lock.json',
    'tsconfig.json',
    'rspack',
    'jest.config.ts',
    'script',
    ".gitignore",
]
const copyMapper = srcDir.map(p => { return { source: path.resolve(__dirname, '..', p), destination: path.resolve(sourceTempDir, p) } })

const filemanagerPlugin = new FileManagerPlugin({
    events: {
        // Archive at the end
        onEnd: [
            // Define plugin to archive zip for different markets
            {
                delete: [normalZipFilePath],
                archive: [{
                    source: outputPath,
                    destination: normalZipFilePath,
                }, {
                    source: outputPath,
                    destination: targetZipFilePath,
                }]
            },
            // Archive source code for FireFox
            {
                copy: [
                    { source: readmeForFirefox, destination: path.join(sourceTempDir, 'README.md') },
                    ...copyMapper
                ],
                archive: [
                    { source: sourceTempDir, destination: normalSourceCodePath },
                    { source: sourceTempDir, destination: targetSourceCodePath },
                ],
                delete: [sourceTempDir],
            },
        ]
    }
})

const option = optionGenerator({ outputPath, manifest: manifestFirefox, mode: "production" })
const { plugins = [] } = option
plugins.push(filemanagerPlugin)
option.plugins = plugins
option.devtool = false

export default option