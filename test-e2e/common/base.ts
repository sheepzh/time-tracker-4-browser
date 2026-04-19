import { type Browser, type CDPSession, launch, type Page, type Target } from "puppeteer"
import { E2E_OUTPUT_PATH } from "../../rspack/constant"
import { removeAllWhitelist } from './whitelist'

const USE_HEADLESS_PUPPETEER = !!process.env['USE_HEADLESS_PUPPETEER']

type HostProxy = {
    host: string
    target: string
}

async function setupBgProxies(serviceWorker: Target, proxies: HostProxy[]): Promise<CDPSession | undefined> {
    let session: CDPSession | undefined
    try {
        session = await serviceWorker.createCDPSession()
        await session.send('Fetch.enable', {
            patterns: proxies.map(p => ({ urlPattern: `*://${p.host}/*`, requestStage: 'Request' as const })),
        })
    } catch {
        // Target may have been closed before the session was ready
        return
    }
    session.on('Fetch.requestPaused', async event => {
        const { requestId, request: { url: originUrl } } = event
        try {
            const url = new URL(originUrl)
            const proxy = proxies.find(p => url.hostname === p.host || url.host === p.host)
            if (!proxy) {
                await session.send('Fetch.continueRequest', { requestId })
                return
            }
            const targetUrl = new URL(proxy.target)
            url.protocol = targetUrl.protocol
            url.hostname = targetUrl.hostname
            url.port = targetUrl.port
            await session.send('Fetch.continueRequest', { requestId, url: String(url) })
        } catch {
            await session.send('Fetch.continueRequest', { requestId })
        }
    })
    return session
}

export interface LaunchContext {
    browser: Browser
    extensionId: string

    close(): Promise<void>

    openAppPage(route: string): Promise<Page>

    newPage(url?: string): Promise<Page>

    newPageAndWaitCsInjected(url: string): Promise<Page>
}

class LaunchContextWrapper implements LaunchContext {

    constructor(
        readonly browser: Browser, readonly extensionId: string,
        private cdpSession: CDPSession | undefined
    ) { }

    async close(): Promise<void> {
        this.cdpSession?.detach().catch(() => { })
        await this.browser.close()
    }

    async openAppPage(route: string): Promise<Page> {
        const page = await this.browser.newPage()
        await page.goto(`chrome-extension://${this.extensionId}/static/app.html#${route}`)
        await page.waitForNetworkIdle()
        return page
    }

    async newPage(url?: string): Promise<Page> {
        const page = await this.browser.newPage()
        url && await page.goto(url, { waitUntil: 'domcontentloaded' })
        return page
    }

    async newPageAndWaitCsInjected(url: string): Promise<Page> {
        const page = await this.browser.newPage()
        await page.goto(url)
        await page.waitForSelector(`#__TIMER_INJECTION_FLAG__${this.extensionId}`)
        return page
    }
}

type BrowserOptions = {
    dirPath?: string
    bgProxies?: HostProxy[]
}

export async function launchBrowser(options?: BrowserOptions): Promise<LaunchContext> {
    const { dirPath = E2E_OUTPUT_PATH, bgProxies } = options ?? {}
    const args = [
        `--disable-extensions-except=${dirPath}`,
        `--load-extension=${dirPath}`,
        '--start-maximized',
        '--no-sandbox',
    ]
    // GitHub-hosted runners use a small /dev/shm; Chrome can crash or hang without this flag.
    if (process.env['GITHUB_ACTIONS'] === 'true') {
        args.push('--disable-gpu', '--disable-dev-shm-usage')
    }
    // Test with large screen
    USE_HEADLESS_PUPPETEER && args.push('--window-size=1880,1000')

    const browser = await launch({
        defaultViewport: null,
        headless: USE_HEADLESS_PUPPETEER,
        enableExtensions: true,
        args,
    })
    const sw = await browser.waitForTarget(target => target.type() === 'service_worker')
    const url = sw.url()
    let extensionId = url.split('/')[2]
    if (!extensionId) throw new Error('Failed to detect extension id')

    const cdpSession = bgProxies?.length ? await setupBgProxies(sw, bgProxies) : undefined
    const context = new LaunchContextWrapper(browser, extensionId, cdpSession)

    // remove whitelist added by service_worker
    await removeAllWhitelist(context)

    return context
}