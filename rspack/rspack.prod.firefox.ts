import path from "path"
import manifestFirefox from "../src/manifest-firefox"
import { FileManagerPlugin } from "./plugins/file-manager"
import optionGenerator from "./rspack.common"
import { enhancePluginWith } from './util'

const { name, version } = require(path.join(__dirname, '..', 'package.json'))

const outputPath = path.resolve(__dirname, '..', 'dist_prod_firefox')
const marketPkgPath = path.resolve(__dirname, '..', 'market_packages')

const normalZipFilePath = path.resolve(marketPkgPath, `${name}-${version}.firefox.zip`)
const targetZipFilePath = path.resolve(marketPkgPath, 'target.firefox.zip')

const fileManagerPlugin = new FileManagerPlugin({
    events: {
        onEnd: [
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

const option = optionGenerator({ outputPath, manifest: manifestFirefox, mode: "production" })
enhancePluginWith(option, fileManagerPlugin)
option.devtool = false

export default option
