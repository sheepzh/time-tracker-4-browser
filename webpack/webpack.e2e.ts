import manifest from "../src/manifest"
import { E2E_NAME } from "../src/util/constant/meta"
import { E2E_OUTPUT_PATH } from "./constant"
import generateOption from "./webpack.common"

manifest.name = E2E_NAME

const options = generateOption({
    outputPath: E2E_OUTPUT_PATH,
    manifest,
    mode: "production",
})

export default options
