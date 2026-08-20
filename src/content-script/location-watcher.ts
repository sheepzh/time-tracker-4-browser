import { trySendMsg2Runtime } from '@api/sw/common'
import { extractHostname } from '@util/pattern'
import Dispatcher from './dispatcher'

function getHost(): string {
    // For file protocol, window.location.host is empty
    return window.location.host || extractHostname(window.location.href).host
}

class LocationWatcher {
    url: string
    host: string
    current: tt4b.site.Current | undefined
    #currHandlers: NoArgCallback[] = []
    #timer: ReturnType<typeof setTimeout>

    get isWhite(): boolean {
        return !!this.current?.white
    }

    private readonly handleChangeBound = this.handleChange.bind(this)

    constructor() {
        this.url = window.location.href
        this.host = getHost()

        // Initialize immediately to catch the initial fields
        window.addEventListener('popstate', this.handleChangeBound)
        window.addEventListener('hashchange', this.handleChangeBound)

        // Because content scripts run in a sandboxed environment, overriding history methods is unnecessary
        // So check URL changed via setTimeout loop instead
        this.#timer = setInterval(this.handleChangeBound, 500)
    }

    async init(dispatcher: Dispatcher) {
        await this.#syncCurrent()
        dispatcher.register('siteChanged', () => void this.#syncCurrent())
    }

    async #syncCurrent() {
        this.current = await trySendMsg2Runtime('site.current', this.url)
        this.#currHandlers.forEach(h => h())
    }

    dispose(): void {
        window.removeEventListener('popstate', this.handleChangeBound)
        window.removeEventListener('hashchange', this.handleChangeBound)
        clearInterval(this.#timer)
    }

    private async handleChange(): Promise<void> {
        const nextUrl = window.location.href
        if (!nextUrl || nextUrl === this.url) return
        this.url = nextUrl
        this.host = getHost()
        await this.#syncCurrent()
    }

    onCurrChange(handler: NoArgCallback) {
        this.#currHandlers.push(handler)
    }
}

export default LocationWatcher
