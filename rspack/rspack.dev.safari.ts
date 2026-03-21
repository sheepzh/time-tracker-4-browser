import path from "path"
import manifest from "./manifest/chrome"
import generateOption from "./rspack.common"

manifest.name = "Time Tracker Safari Dev"

const options = generateOption({
    outputPath: path.join(__dirname, '..', 'dist_dev_safari'),
    manifest,
    mode: "development",
})

export default options