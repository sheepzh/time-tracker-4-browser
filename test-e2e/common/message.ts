import { type Page } from 'puppeteer'

export async function waitForMessage(page: Page, msg: string): Promise<void> {
    await page.waitForFunction(
        (msg: string) => {
            const messages = document.querySelectorAll('.el-message')
            return Array.from(messages).some(el => el.textContent === msg)
        },
        { timeout: 5000 },
        msg,
    )
}

export async function waitForSuccMessage(page: Page) {
    return waitForMessage(page, 'Successfully!')
}