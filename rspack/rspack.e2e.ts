import manifest from "../src/manifest"
import { E2E_NAME } from "../src/util/constant/meta"
import { E2E_OUTPUT_PATH } from "./constant"
import generateOption from "./rspack.common"

manifest.name = E2E_NAME
// Grant all permissions as required for e2e testing
const permissions = manifest.permissions ??= []
permissions.push(...manifest.optional_permissions ?? [])
manifest.optional_permissions = []

const options = generateOption({
    outputPath: E2E_OUTPUT_PATH,
    manifest,
    mode: "production",
})

export default options
