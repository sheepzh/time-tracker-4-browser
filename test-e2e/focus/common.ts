import type { Frame, Page } from 'puppeteer'
import { fillCondEditor } from '../common/cond-editor'

async function selectMethod(page: Page, method: tt4b.focus.Method): Promise<void> {
    await page.waitForSelector('.el-card', { timeout: 3000 })
    const cards = await page.$$('.el-card')
    const card = cards[method === 'focus' ? 0 : 1]
    if (!card) throw new Error(`Method card not found: ${method}`)
    await card.click()
    await page.waitForSelector('.cond-editor', { timeout: 500 })
}

async function setMode(page: Page, policy: tt4b.focus.FilterPolicy): Promise<void> {
    const buttons = await page.$$('.el-radio-button')
    const button = buttons[policy === 'allow' ? 0 : 1]
    if (!button) throw new Error(`Policy button not found: ${policy}`)
    await button.click()
}

const actionBtnId = (action: tt4b.focus.Action): string => {
    // todo : use data attribute for better stability
    if (action === 'start') return 'start-btn'
    if (action === 'resume') return 'resume-btn'
    if (action === 'stop') return 'stop-btn'
    if (action === 'pause') return 'pause-btn'
    throw new Error(`Unsupported action: ${action}`)
}

export async function clickAction(page: Page, action: tt4b.focus.Action): Promise<void> {
    const selector = `.el-button[data-testid="${actionBtnId(action)}"]`
    await page.click(selector)
    // Normal action, only click
    if (action !== 'stop') return

    await page.waitForSelector('.el-popover', { visible: true, timeout: 3000 })
    await page.evaluate((s: string) => {
        const btn = document.querySelector(s)
        if (!(btn instanceof HTMLElement)) throw new Error(`Confirm button not found: ${s}`)
        const popoverId = btn.getAttribute('aria-describedby')
        if (!popoverId) throw new Error(`Popover not found for button: ${s}`)
        const popover = document.getElementById(popoverId)
        if (!popover) throw new Error(`Popover element not found: ${popoverId}`)
        const confirmBtn = popover.querySelector(`#${popoverId} .el-popconfirm__action button:last-child`)
        if (!(confirmBtn instanceof HTMLElement)) throw new Error(`Confirm button not found in popover: ${popoverId}`)
        confirmBtn.click()
    }, selector)
}

export async function startSession(page: Page, config: tt4b.focus.Config): Promise<void> {
    await selectMethod(page, config.method)
    await setMode(page, config.policy)
    await fillCondEditor(page, config.cond)
    await clickAction(page, 'start')
}

export async function startSessionViaApi(page: Page, config: tt4b.focus.Config): Promise<void> {
    await page.evaluate(
        config => new Promise<void>((resolve, reject) => chrome.runtime.sendMessage(
            { code: 'focus.action', data: { action: 'start', config } satisfies tt4b.focus.ActionRequest },
            res => res?.code === 'success' ? resolve() : reject(res?.msg ?? 'focus.action failed')
        )),
        config,
    )
}

export async function getFocusBlockInfo(frame: Frame): Promise<{ prompt: string, stoppable: boolean }> {
    const selector = 'div[data-testid="prompt"]'
    await frame.waitForSelector(selector, { timeout: 3000 })
    return frame.evaluate((s: string) => {
        const app = document.getElementById('app')
        const prompt = app?.querySelector(s)?.textContent ?? ''
        const stopBtn = app?.querySelector('.el-button[data-testid="stop-btn"]')
        const stoppable = stopBtn instanceof HTMLElement && stopBtn.style.display !== 'none'
        return { prompt, stoppable }
    }, selector)
}