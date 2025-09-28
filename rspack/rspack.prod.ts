import path from "path"
import manifest from "../src/manifest"
import { FileManagerPlugin } from "./plugins/file-manager"
import optionGenerator from "./rspack.common"

const { name, version } = require(path.join(__dirname, '..', 'package.json'))

const outputPath = path.resolve(__dirname, '..', 'dist_prod')
const marketPkgPath = path.resolve(__dirname, '..', 'market_packages')

const normalZipFilePath = path.resolve(marketPkgPath, `${name}-${version}.mv3.zip`)
const targetZipFilePath = path.resolve(marketPkgPath, `target.zip`)

const filemanagerPlugin = new FileManagerPlugin({
    events: {
        // Archive at the end
        onEnd: [
            { delete: [path.join(outputPath, '*.LICENSE.txt')] },
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
        ]
    }
})

const option = optionGenerator({ outputPath, manifest, mode: "production" })

const { plugins = [] } = option
plugins.push(filemanagerPlugin)
option.plugins = plugins
option.devtool = false

export default option