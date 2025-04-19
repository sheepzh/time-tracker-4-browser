import { type Browser, launch, type Page } from "puppeteer"
import { E2E_OUTPUT_PATH } from "../../webpack/constant"

const USE_HEADLESS_PUPPETEER = !!process.env['USE_HEADLESS_PUPPETEER']

export interface LaunchContext {
    browser: Browser
    extensionId: string

    close(): Promise<void>

    openAppPage(route: string): Promise<Page>

    newPage(url?: string): Promise<Page>

    newPageAndWaitCsInjected(url: string): Promise<Page>
}

class LaunchContextWrapper implements LaunchContext {
    browser: Browser
    extensionId: string

    constructor(browser: Browser, extensionId: string) {
        this.browser = browser
        this.extensionId = extensionId
    }

    close(): Promise<void> {
        return this.browser.close()
    }

    async openAppPage(route: string): Promise<Page> {
        const page = await this.browser.newPage()
        await page.goto(`chrome-extension://${this.extensionId}/static/app.html#${route}`)
        return page
    }

    async newPage(url?: string): Promise<Page> {
        const page = await this.browser.newPage()
        if (url) {
            await page.goto(url, { waitUntil: 'domcontentloaded' })
        }
        return page
    }

    async newPageAndWaitCsInjected(url: string): Promise<Page> {
        const page = await this.browser.newPage()
        await page.goto(url)
        await page.waitForSelector(`#__TIMER_INJECTION_FLAG__${this.extensionId}`)
        return page
    }
}

export async function launchBrowser(dirPath?: string): Promise<LaunchContext> {
    dirPath = dirPath ?? E2E_OUTPUT_PATH

    const browser = await launch({
        defaultViewport: null,
        headless: USE_HEADLESS_PUPPETEER,
        args: [
            `--disable-extensions-except=${dirPath}`,
            `--load-extension=${dirPath}`,
            '--start-maximized',
            '--no-sandbox',
        ],
    })
    const serviceWorker = await browser.waitForTarget(target => target.type() === 'service_worker')
    const url = serviceWorker.url()
    let extensionId: string | undefined = url.split('/')[2]
    if (!extensionId) {
        throw new Error('Failed to detect extension id')
    }

    return new LaunchContextWrapper(browser, extensionId)
}

export function sleep(seconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

export const MOCK_HOST = "127.0.0.1:12345"

export const MOCK_URL = "http://" + MOCK_HOST

export const MOCK_HOST_2 = "127.0.0.1:12346"

export const MOCK_URL_2 = "http://" + MOCK_HOST_2
