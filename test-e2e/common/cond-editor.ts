import type { Page } from 'puppeteer'
import { sleep } from './util'

/**
 * Fill URLs into a CondEditor component on the page.
 *
 * @param page - Puppeteer page instance
 * @param urls - URLs to add
 * @param ancestor - Optional ancestor selector to scope the CondEditor (e.g. '.el-dialog')
 */
export async function fillCondEditor(page: Page, urls: string[], ancestor?: string) {
    const selector = ancestor ? `${ancestor} .cond-editor input` : '.cond-editor input'
    const input = await page.waitForSelector(selector, { visible: true })
    for (const url of urls) {
        await input!.click()
        await page.keyboard.type(url)
        await sleep(.2)
        await page.keyboard.press('Enter')
        await sleep(.2)
    }
}
