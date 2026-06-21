import { trySendMsg2Runtime } from '@api/sw/common'
import { extractHostname } from '@util/pattern'

function getHost(): string {
    // For file protocol, window.location.host is empty
    return window.location.host || extractHostname(window.location.href).host
}

type ChangeEvent = {
    prevUrl: string
    prevHost: string
    nextUrl: string
    nextHost: string
}

class LocationWatcher {
    url: string
    host: string
    whitelisted: boolean
    #handlers: ArgCallback<ChangeEvent>[] = []
    #timer: ReturnType<typeof setTimeout>

    private readonly handleChangeBound = this.handleChange.bind(this)

    constructor() {
        this.url = window.location.href
        this.host = getHost()
        this.whitelisted = false

        // Initialize immediately to catch the initial fields
        window.addEventListener('popstate', this.handleChangeBound)
        window.addEventListener('hashchange', this.handleChangeBound)

        // Because content scripts run in a sandboxed environment, overriding history methods is unnecessary
        // So check URL changed via setTimeout loop instead
        this.#timer = setInterval(this.handleChangeBound, 500)
    }

    async init() {
        await this.#syncWhitelisted()
    }

    async #syncWhitelisted() {
        const value = await trySendMsg2Runtime('whitelist.contain', { host: this.host, url: this.url })
        this.whitelisted = !!value
    }

    dispose(): void {
        window.removeEventListener('popstate', this.handleChangeBound)
        window.removeEventListener('hashchange', this.handleChangeBound)
        clearInterval(this.#timer)
    }

    private async handleChange(): Promise<void> {
        const nextUrl = window.location.href
        if (!nextUrl || nextUrl === this.url) return
        const nextHost = getHost()

        const prevUrl = this.url
        const prevHost = this.host

        this.url = nextUrl
        this.host = nextHost
        await this.#syncWhitelisted()

        const ev: ChangeEvent = {
            prevUrl: prevUrl,
            nextUrl: nextUrl,
            prevHost: prevHost,
            nextHost: nextHost,
        }
        this.#handlers.forEach(h => h(ev))
    }

    onChange(handler: ArgCallback<ChangeEvent>): void {
        this.#handlers.push(handler)
    }
}

export default LocationWatcher
