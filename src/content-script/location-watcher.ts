type UrlChangeHandler = (url: string, prevUrl: string) => void

class LocationWatcher {
    private url: string
    private timer: number | undefined
    private initialized = false
    private originalPushState: History['pushState'] | undefined
    private originalReplaceState: History['replaceState'] | undefined
    private readonly handleChangeBound = this.handleChange.bind(this)

    constructor(url: string, private readonly handler: UrlChangeHandler, private readonly interval = 800) {
        this.url = url
    }

    init(): void {
        if (this.initialized) return
        this.initialized = true

        window.addEventListener('popstate', this.handleChangeBound)
        window.addEventListener('hashchange', this.handleChangeBound)
        this.timer = window.setInterval(this.handleChangeBound, this.interval)

        this.originalPushState = history.pushState
        this.originalReplaceState = history.replaceState

        history.pushState = (...args: Parameters<History['pushState']>) => {
            this.originalPushState!.apply(history, args)
            this.handleChangeBound()
        }
        history.replaceState = (...args: Parameters<History['replaceState']>) => {
            this.originalReplaceState!.apply(history, args)
            this.handleChangeBound()
        }
    }

    dispose(): void {
        if (!this.initialized) return
        this.initialized = false

        window.removeEventListener('popstate', this.handleChangeBound)
        window.removeEventListener('hashchange', this.handleChangeBound)
        this.timer && clearInterval(this.timer)
        this.timer = undefined

        if (this.originalPushState) {
            history.pushState = this.originalPushState
            this.originalPushState = undefined
        }
        if (this.originalReplaceState) {
            history.replaceState = this.originalReplaceState
            this.originalReplaceState = undefined
        }
    }

    private handleChange(): void {
        const url = window.location.href
        if (!url || url === this.url) return
        const prevUrl = this.url
        this.url = url
        this.handler(url, prevUrl)
    }
}

export default LocationWatcher
