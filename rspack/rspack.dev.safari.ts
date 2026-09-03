import path from "node:path"
import manifest from "../src/manifest"
import generateOption from "./rspack.common"

manifest.name = "Time Tracker Safari Dev"

const options = generateOption({
    outputPath: path.join(__dirname, '..', 'dist_dev_safari'),
    manifest,
    mode: "development",
})

export default options