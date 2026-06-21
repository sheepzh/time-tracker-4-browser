import type { Page } from 'puppeteer'

/**
 * Fill URLs into a CondEditor component on the page.
 *
 * @param page - Puppeteer page instance
 * @param urls - URLs to add
 * @param ancestor - Optional ancestor selector to scope the CondEditor (e.g. '.el-dialog')
 */
export async function fillCondEditor(page: Page, urls: string[], ancestor: string = '') {
    const baseSelector = `${ancestor} .cond-editor`.trim()
    await page.waitForSelector(baseSelector, { visible: true, timeout: 500 })
    const inputSelector = `${baseSelector} input`.trim()
    const tagSelector = `${baseSelector} .el-tag`.trim()
    const input = await page.waitForSelector(inputSelector, { visible: true })

    if (!input) throw new Error('CondEditor input not found')

    for (const [index, url] of [...new Set(urls)].entries()) {
        await input.click()
        await page.keyboard.type(url)
        await page.keyboard.press('Enter')
        const expectedCount = index + 1
        await page.waitForFunction(
            (sel: string, count: number) => document.querySelectorAll(sel).length === count,
            { timeout: 500 },
            tagSelector, expectedCount
        )
    }
}
