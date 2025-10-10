import path from "path"
import manifest from "../src/manifest-firefox"
import { E2E_NAME } from "../src/util/constant/meta"
import generateOption from "./rspack.common"

manifest.name = E2E_NAME
// Fix the crx id for development mode
manifest.key = "clbbddpinhgdejpoepalbfnkogbobfdb"
// The manifest.json is different from Chrome's with add-on ID
manifest.browser_specific_settings = { gecko: { id: 'timer@zhy' } }

const options = generateOption({
    outputPath: path.join(__dirname, '..', 'dist_e2e'),
    manifest,
    mode: "development",
})
options.output = { ...options.output, clean: true }

export default options
