import type { ElementHandle, Frame, Page } from "puppeteer"
import { sleep } from "../common/util"

export async function waitForLimitFrame(page: Page, timeout = 5000): Promise<Frame> {
    return page.waitForFrame(f => f.url().includes('limit.html'), { timeout })
}

export async function isLimitModalVisible(page: Page): Promise<boolean> {
    await page.waitForSelector('extension-time-tracker-overlay', { timeout: 3000 })
    return await page.evaluate(async () => {
        const overlay = document.querySelector('extension-time-tracker-overlay')
        if (!overlay) return false
        const iframe = overlay.shadowRoot?.firstElementChild
        return iframe instanceof HTMLIFrameElement
            && iframe.style.visibility !== 'hidden'
            && iframe.style.display !== 'none'
    })
}

export async function createLimitRule(rule: timer.limit.Rule, page: Page) {
    const createButton = await page.$('.el-card:first-child .el-button:last-child')
    await createButton!.click()
    // 1 Fill the name
    await page.waitForSelector('.el-dialog .el-input input')
    const nameInput = await page.$('.el-dialog .el-input input')
    await nameInput!.focus()
    await nameInput?.click({ count: 3 })
    await sleep(.1)
    page.keyboard.type(rule.name)
    await new Promise(resolve => setTimeout(resolve, 400))
    await page.click('.el-dialog .el-button.el-button--primary')
    // 2. Fill the condition
    const configInput = await page.$('.el-dialog #site-input')
    for (const url of rule.cond || []) {
        await configInput!.focus()
        await page.keyboard.type(url)
        await sleep(.1)
        await page.keyboard.press('ArrowDown')
        await sleep(.1)
        await page.keyboard.press('Enter')
    }
    await sleep(.1)
    await page.click('.el-dialog .el-button.el-button--primary')
    // 3. Fill the rule
    await sleep(.1)
    const { time, weekly, visitTime, count, weeklyCount } = rule || {}
    const [fstTime, secTime, trdTime] = await page.$$('.el-dialog .el-date-editor input')
    fstTime && await fillTimeLimit(time, fstTime, page)
    secTime && await fillTimeLimit(weekly, secTime, page)
    trdTime && await fillTimeLimit(visitTime, trdTime, page)
    const [fstVisit, secVisit] = await page.$$('.el-dialog .el-input-number input')
    fstVisit && await fillVisitLimit(count!, fstVisit, page)
    secVisit && await fillVisitLimit(weeklyCount!, secVisit, page)

    // 4. Save
    await sleep(.3)
    await page.click('.el-dialog .el-button.el-button--success')
    if (rule.allowDelay) {
        await page.waitForSelector('.el-table__body .el-table__row td:nth-child(9) .el-switch')
        await page.evaluate(async () => {
            document.querySelector<HTMLElement>('.el-table__body .el-table__row td:nth-child(9) .el-switch')?.click()
        })
        await sleep(.3)
    }
}

export async function fillTimeLimit(value: number | undefined, input: ElementHandle<HTMLInputElement>, page: Page): Promise<void> {
    value = value ?? 0
    const hour = Math.floor(value / 3600)
    value = value - hour * 3600
    const minute = Math.floor(value / 60)
    const second = value - minute * 60
    await input.click()
    await sleep(.5)
    const panel = await page.$('.el-popper:not([style*="display:none"]):not([style*="display: none"]) div.el-time-panel')
    await panel!.evaluate(async (el, hour, minute, second) => {
        const hourSpinner = el.querySelector('.el-scrollbar:first-child .el-scrollbar__wrap')
        hourSpinner!.scrollTo(0, hour * 32)
        const minuteSpinner = el.querySelector('.el-scrollbar:nth-child(2) .el-scrollbar__wrap')
        minuteSpinner!.scrollTo(0, minute * 32)
        const secondSpinner = el.querySelector('.el-scrollbar:nth-child(3) .el-scrollbar__wrap')
        secondSpinner!.scrollTo(0, second * 32)
        // Wait scroll handler finished
        await new Promise(resolve => setTimeout(resolve, 250))
        const confirmBtn = el.querySelector('.el-time-panel__footer .el-time-panel__btn.confirm') as HTMLButtonElement
        confirmBtn.click()
    }, hour, minute, second)
    await sleep(.2)
}

async function fillVisitLimit(value: number, input: ElementHandle<HTMLInputElement>, page: Page) {
    await input.focus()
    await page.keyboard.press('Delete')
    await page.keyboard.type(`${value ?? 0}`)
}

export async function clickDelay(testPage: Page) {
    const limitFrame = await waitForLimitFrame(testPage)
    const moreBtn = await limitFrame.waitForSelector('.el-button--primary')
    await moreBtn!.click()
    await sleep(.8)
}