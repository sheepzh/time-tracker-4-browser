import { ElementHandle, type Page } from "puppeteer"
import { sleep } from "../common/base"

export async function createLimitRule(rule: timer.limit.Rule, page: Page) {
    const createButton = await page.$('.el-card:first-child .el-button:last-child')
    await createButton!.click()
    // 1 Fill the name
    await page.waitForSelector('.el-dialog .el-input input')
    const nameInput = await page.$('.el-dialog .el-input input')
    await nameInput!.focus()
    page.keyboard.type(rule.name)
    await new Promise(resolve => setTimeout(resolve, 400))
    await page.click('.el-dialog .el-button.el-button--primary')
    // 2. Fill the condition
    const configInput = await page.$('.el-dialog .el-input.el-input-group input')
    for (const url of rule.cond || []) {
        await configInput!.focus()
        await page.keyboard.type(url)
        await sleep(.1)
        await page.keyboard.press('Enter')
    }
    await sleep(.1)
    await page.click('.el-dialog .el-button.el-button--primary')
    // 3. Fill the rule
    await sleep(.1)
    const { time, weekly, visitTime, count, weeklyCount } = rule || {}
    const timeInputs = await page.$$('.el-dialog .el-date-editor input')
    await fillTimeLimit(time, timeInputs[0], page)
    await fillTimeLimit(weekly, timeInputs[1], page)
    await fillTimeLimit(visitTime, timeInputs[2], page)
    const visitInputs = await page.$$('.el-dialog .el-input-number input')
    await fillVisitLimit(count!, visitInputs[0], page)
    await fillVisitLimit(weeklyCount!, visitInputs[1], page)

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

export async function fillVisitLimit(value: number, input: ElementHandle<HTMLInputElement>, page: Page) {
    await input.focus()
    await page.keyboard.press('Delete')
    await page.keyboard.type(`${value ?? 0}`)
}