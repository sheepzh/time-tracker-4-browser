import { E2E_NAME } from "../packages/shared/src/constant/meta"
import { E2E_OUTPUT_PATH } from "./constant"
import manifest from "./manifest/chrome"
import generateOption from "./rspack.common"

manifest.name = E2E_NAME

const options = generateOption({
    outputPath: E2E_OUTPUT_PATH,
    manifest,
    mode: "production",
})

export default options
