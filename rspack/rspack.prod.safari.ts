import path from "path"
import { name, version } from '../package.json'
import manifest from "../src/manifest"
import { FileManagerPlugin } from "./plugins/file-manager"
import generateOption from "./rspack.common"

const outputPath = path.join(__dirname, '..', 'dist_prod_safari')
const normalZipFilePath = path.resolve(__dirname, '..', 'market_packages', `${name}-${version}-safari.zip`)

const options = generateOption({ outputPath, manifest, mode: "production" })

const fileManagerPlugin = new FileManagerPlugin({
    events: {
        // Archive at the end
        onEnd: [
            { delete: [path.join(outputPath, '*.LICENSE.txt')] },
            // Define plugin to archive zip for different markets
            {
                delete: [normalZipFilePath],
                archive: [{ source: outputPath, destination: normalZipFilePath }]
            }
        ]
    }
})

const { plugins = [] } = options
plugins.push(fileManagerPlugin)
options.plugins = plugins

export default options