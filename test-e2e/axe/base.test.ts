import axe, { source } from "axe-core"
import { type Page } from 'puppeteer'
import { launchBrowser, type LaunchContext } from "../common/base"

type AxeType = typeof axe
let context: LaunchContext

describe('After installed', () => {
    beforeEach(async () => context = await launchBrowser())

    // afterEach(async () => context.close())

    test('Open the official page', async () => {

        const page = await context.openAppPage("/data/dashboard")
        await initAxe(page)
        const result = await page.evaluate(async () => {
            // axe.run()
            const axeRes = await (window as unknown as { axe: AxeType }).axe.run()
            console.log(axeRes)
            return axeRes
        })
    }, 5000)
})

export const initAxe = async (page: Page) => {
    await page.evaluate(async (source: string) => {
        await eval(source)
    }, source)
}