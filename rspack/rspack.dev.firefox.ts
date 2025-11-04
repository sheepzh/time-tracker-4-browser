import path from "path"
import manifest from "../src/manifest-firefox"
import generateOption from "./rspack.common"

manifest.name = "IS DEV"
// Fix the crx id for development mode
manifest.key = "clbbddpinhgdejpoepalbfnkogbobfdb"
// The manifest.json is different from Chrome's with add-on ID
manifest.browser_specific_settings = {
    ...manifest.browser_specific_settings,
    gecko: {
        ...manifest.browser_specific_settings?.gecko,
        id: 'timer@zhy',
    }
}

const options = generateOption({
    outputPath: path.join(__dirname, '..', 'dist_dev_firefox'),
    manifest,
    mode: "development",
})

export default options
