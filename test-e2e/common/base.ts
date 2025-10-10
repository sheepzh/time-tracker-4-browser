import { readFile } from 'fs/promises'
import { join } from 'path'
import { type Browser, launch, type Page, SupportedBrowser } from "puppeteer"
import { E2E_OUTPUT_PATH } from "../../rspack/constant"

const USE_HEADLESS_PUPPETEER = !!process.env['USE_HEADLESS_PUPPETEER']
const TARGET: SupportedBrowser = process.env['USE_FIREFOX_PUPPETEER'] ? 'firefox' : 'chrome'

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
        if (TARGET === 'firefox') {
            page.goto(`moz-extension://${this.extensionId}/static/app.html#${route}`)
            await sleep(.1)
            return page
        }
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

    if (TARGET === 'chrome') {
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
        const extensionId: string | undefined = url.split('/')[2]
        if (!extensionId) {
            throw new Error('Failed to detect extension id')
        }
        return new LaunchContextWrapper(browser, extensionId)
    } else if (TARGET === 'firefox') {
        const browser = await launch({
            defaultViewport: null,
            headless: USE_HEADLESS_PUPPETEER,
            protocol: 'webDriverBiDi',
            browser: 'firefox',
            args: [
                '--disable-web-security',
                '--no-sandbox',
            ],
        })
        const addonId = await browser.installExtension(dirPath)
        const profileDir = getFirefoxProfileDir(browser)
        if (!profileDir) {
            throw new Error('Failed to get firefox profile dir')
        }
        const internalUUID = await readUuidFromPrefs(profileDir, addonId)
        return new LaunchContextWrapper(browser, internalUUID)
    } else {
        throw new Error('Unsupported browser: ' + TARGET)
    }
}

function getFirefoxProfileDir(browser: Browser): string | undefined {
    const proc = browser.process()
    const args = proc?.spawnargs ?? []
    const idx = args.findIndex(a => a === '--profile')
    if (idx >= 0 && args[idx + 1]) {
        return args[idx + 1]
    }
    return undefined
}

async function readUuidFromPrefs(profileDir: string, addonId: string): Promise<string> {
    const jsPath = join(profileDir, 'prefs.js')
    while (true) {
        try {
            const text = await readFile(jsPath, 'utf-8')
            const re = /user_pref\("extensions\.webextensions\.uuids",\s*"((?:\\.|[^"\\])*)"\)/
            const m = re.exec(text)
            if (!m) continue
            const escaped = m[1]
            const jsonText = JSON.parse(`"${escaped}"`)
            const mappings = JSON.parse(jsonText)
            const uuid = mappings[addonId]
            if (uuid) return uuid
        } catch (e) {
            console.info('Waiting for prefs.js to be ready...', e)
            await sleep(0.1)
        }
    }
}

export function sleep(seconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

export const MOCK_HOST = "127.0.0.1:12345"

export const MOCK_URL = "http://" + MOCK_HOST

export const MOCK_HOST_2 = "127.0.0.1:12346"

export const MOCK_URL_2 = "http://" + MOCK_HOST_2
