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
    if (action === 'abort') return 'abort-btn'
    if (action === 'pause') return 'pause-btn'
    throw new Error(`Unsupported action: ${action}`)
}

export async function clickAction(page: Page, action: tt4b.focus.Action): Promise<void> {
    const selector = `.el-button[data-testid="${actionBtnId(action)}"]`
    const button = await page.waitForSelector(selector, { timeout: 3000 })
    if (!button) throw new Error(`Button not found for action: ${action}`)
    await button.click()
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

export async function getFocusBlockInfo(frame: Frame): Promise<{ title: string, abortVisible: boolean }> {
    await frame.waitForSelector('h2', { timeout: 3000 })
    return frame.evaluate(() => {
        const app = document.querySelector('#app')
        const title = app?.querySelector('h2')?.textContent ?? ''
        // todo : use data attribute for better stability
        const abortBtn = app?.querySelector('.el-button[data-testid="abort-btn"]')
        const abortVisible = abortBtn instanceof HTMLElement && abortBtn.style.display !== 'none'
        return { title, abortVisible }
    })
}