import type { Frame, Page } from 'puppeteer'

const OVERLAY_TAG = 'extension-time-tracker-overlay'
const LIMIT_HTML = 'limit.html'

export async function waitForLimitFrame(page: Page, timeout = 5000): Promise<Frame> {
    return page.waitForFrame(f => f.url().includes(LIMIT_HTML), { timeout })
}

export async function assertOverlayVisible(page: Page, timeout = 3000): Promise<void> {
    await page.waitForFunction((tag: string) => {
        const overlay = document.querySelector(tag)
        if (!overlay) return false
        const iframe = overlay.shadowRoot?.firstElementChild
        if (!(iframe instanceof HTMLIFrameElement)) return false
        const { visibility, display } = iframe.style
        return visibility !== 'hidden' && display !== 'none'
    }, { timeout }, OVERLAY_TAG)
}

export async function assertOverlayHidden(page: Page, timeout = 3000): Promise<void> {
    await page.waitForFunction((tag: string) => {
        const overlay = document.querySelector(tag)
        if (!overlay) return true
        const iframe = overlay.shadowRoot?.firstElementChild
        if (!(iframe instanceof HTMLIFrameElement)) return true
        const { visibility, display } = iframe.style
        return visibility === 'hidden' || display === 'none'
    }, { timeout }, OVERLAY_TAG)
}