import path from "path"
import manifest from "./manifest/chrome"
import generateOption from "./rspack.common"

manifest.name = "IS DEV"

const options = generateOption({
    outputPath: path.join(__dirname, '..', 'dist_dev'),
    manifest,
    mode: "development",
})

export default options
