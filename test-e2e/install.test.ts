import { join } from "path"
import { launchBrowser, type LaunchContext } from "./common/base"

let context: LaunchContext

describe('After installed', () => {
    beforeEach(async () => {
        const path = join(__dirname, '..', 'dist_prod')
        context = await launchBrowser({ dirPath: path })
    })

    afterEach(async () => context.close())

    test('Open the official page', async () => {
        const { browser } = context
        await browser.waitForTarget(target => target.url().includes('wfhg.cc'))
    })
})

