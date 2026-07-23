import { FULL_PERIOD } from '@pages/util/limit'
import type { ElementHandle, Page } from "puppeteer"
import { fillCondEditor } from "../common/cond-editor"
import { waitForLimitFrame } from '../common/overlay'
import { assertExist, sleep } from "../common/util"

export async function waitForLimitModal(page: Page, timeout = 15000): Promise<void> {
    await page.waitForFunction(
        () => {
            const overlay = document.querySelector('extension-time-tracker-overlay')
            if (!overlay) return false
            const iframe = overlay.shadowRoot?.firstElementChild
            return iframe instanceof HTMLIFrameElement
                && iframe.style.visibility !== 'hidden'
                && iframe.style.display !== 'none'
        },
        { timeout },
    )
}

type RuleCreate = Omit<tt4b.limit.Rule, 'id' | 'enabled' | 'blocked' | 'locked'>

export async function createLimitRule(rule: RuleCreate, page: Page) {
    const { name, cond, time, weekly, visitTime, count, weeklyCount, periods } = rule
    const createButton = await page.$('.el-card:first-child .el-button:last-child')
    await createButton!.click()
    // 1 Fill the name
    await page.waitForSelector('.el-dialog .el-input input')
    const nameInput = assertExist(await page.$('.el-dialog .el-input input'))
    await nameInput.focus()
    await nameInput.click({ count: 3 })
    await sleep(.1)
    await page.keyboard.type(name)
    await new Promise(resolve => setTimeout(resolve, 400))
    await page.click('.el-dialog .el-button.el-button--primary')
    // 2. Fill the condition
    await fillCondEditor(page, cond, '.el-dialog')
    await sleep(.1)
    await page.click('.el-dialog .el-button.el-button--primary')
    // 3. Fill the rule
    await sleep(.1)
    const [fstTime, secTime, trdTime] = await page.$$('.el-dialog .el-date-editor input')
    await fillTimeLimit(time, assertExist(fstTime), page)
    await fillTimeLimit(weekly, assertExist(secTime), page)
    await fillTimeLimit(visitTime, assertExist(trdTime), page)
    const [fstVisit, secVisit] = await page.$$('.el-dialog .el-input-number input')
    await fillVisitLimit(count ?? 0, assertExist(fstVisit), page)
    await fillVisitLimit(weeklyCount ?? 0, assertExist(secVisit), page)
    await fillPeriods(periods ?? [], page)

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
    await assertExist(panel).evaluate(async (el, hour, minute, second) => {
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

function formatPeriodTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

async function fillPeriods(periods: tt4b.limit.Period[], page: Page) {
    const input = assertExist(await page.$('*[data-testid="limit-period"]'))
    // 1. clear all the tags firstly
    for (const btn of await input.$$('button.el-tag__close')) {
        await btn.click()
        await sleep(.1)
    }
    for (const p of periods) {
        const createBtn = await input.$('*[data-testid="create"]')
        await assertExist(createBtn).click()
        await sleep(.1)

        const [start, end] = p
        if (start === FULL_PERIOD[0] && end === FULL_PERIOD[1]) {
            const allTimeBtn = await input.$('*[data-testid="all-time"]')
            await assertExist(allTimeBtn).click()
            await sleep(.1)
            continue
        }

        const inputs = await input.$$('input.el-input__inner')
        const startInput = assertExist(inputs[0])
        const endInput = assertExist(inputs[1])
        await startInput.click({ count: 3 })
        await startInput.type(formatPeriodTime(start))
        await page.keyboard.press('Tab')
        await endInput.click({ count: 3 })
        await endInput.type(formatPeriodTime(end))

        await sleep(.1)

        const saveBtn = await input.$('*[data-testid="save"]')
        await assertExist(saveBtn).click()
        await sleep(.1)
    }
}

export async function clickDelay(testPage: Page) {
    const limitFrame = await waitForLimitFrame(testPage)
    const moreBtn = await limitFrame.waitForSelector('.el-button--primary')
    await assertExist(moreBtn).click()
    await sleep(.8)
}