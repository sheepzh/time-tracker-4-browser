import path from "path"
import optionGenerator from "./webpack.common"
import FileManagerWebpackPlugin from "filemanager-webpack-plugin"
import webpack from "webpack"

const { name, version } = require(path.join(__dirname, '..', 'package.json'))

const outputDir = path.join(__dirname, '..', 'dist_prod_safari')
const normalZipFilePath = path.resolve(__dirname, '..', 'market_packages', `${name}-${version}-safari.zip`)

const options = optionGenerator(
    outputDir,
    baseManifest => {
        baseManifest.name = 'Timer'
    }
)

const filemanagerWebpackPlugin = new FileManagerWebpackPlugin({
    events: {
        // Archive at the end
        onEnd: [
            { delete: [path.join(outputDir, '*.LICENSE.txt')] },
            // Define plugin to archive zip for different markets
            {
                delete: [normalZipFilePath],
                archive: [{ source: outputDir, destination: normalZipFilePath }]
            }
        ]
    }
})

options.mode = 'production'
options.plugins.push(filemanagerWebpackPlugin as webpack.WebpackPluginInstance)
options.output.path = outputDir

export default options