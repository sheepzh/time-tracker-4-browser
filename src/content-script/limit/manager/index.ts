import { getUrl } from '@api/chrome/runtime'
import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import { ModalBridge } from '../modal/bridge'
import type { Reason, VisitData } from '../types'
import DelayCoordinator from './delay-coordinator'
import ScreenLocker from './screen-locker'
import LimitState from './state'

const MODAL_URL = getUrl('static/limit.html')
const MSG_ORIGIN = new URL(MODAL_URL).origin
const TAG_NAME = 'extension-time-tracker-overlay'
const CHROME_HIDE_CLS = '__web-inspector-hide-shortcut__'

type ShowArgs = [reason: Reason]

function createRootElement(): HTMLElement {
    const element = document.createElement(TAG_NAME)
    element.style.display = 'block'
    element.style.position = 'fixed'
    element.style.inset = '0'
    element.style.width = '100vw'
    element.style.height = '100vh'
    element.style.zIndex = String(Number.MAX_SAFE_INTEGER)
    return element
}

function isValidFrame(iframe: HTMLIFrameElement): boolean {
    try {
        return new URL(iframe.src).origin === MSG_ORIGIN
    } catch {
        return false
    }
}

class ModalManager {
    #el?: HTMLElement
    #iframe?: HTMLIFrameElement
    #sl = new ScreenLocker()
    #bridge: ModalBridge
    #reqQueue: Parameters<ModalBridge['request']>[] = []
    #content?: ShowArgs
    #observer?: MutationObserver

    constructor(private location: LocationWatcher) {
        this.#bridge = new ModalBridge(MSG_ORIGIN, () => this.#iframe?.contentWindow ?? undefined)
        location.onCurrChange(() => this.#notify('url', location.url))
    }

    init(state: LimitState, delayCoord: DelayCoordinator, visit: VisitData) {
        this.#bridge
            .register('delay', reason => delayCoord.process(reason))
            // fixme: refactor this, this action should be handled by the focus processor
            .register('stop', () => trySendMsg2Runtime('focus.action', 'stop'))

        this.#notify('url', this.location.url)
        this.#startObserve()

        visit.onChange(time => this.#notify('visitTime', time))
        state.onChange(current => current ? this.#show(current) : this.#hide())
    }

    #notify(...params: Parameters<ModalBridge['request']>) {
        if (!this.#iframe?.contentWindow || !isValidFrame(this.#iframe)) {
            this.#reqQueue.push(params)
            return
        }
        this.#bridge.request(...params).catch(() => { })
    }

    #startObserve() {
        if (this.#observer) return
        this.#observer = new MutationObserver(mutations => {
            const el = this.#el
            const iframe = this.#iframe
            if (!el || !this.#content) return
            const removed = mutations.flatMap(m => Array.from(m.removedNodes))
                .some(n => n === el || (n instanceof Element && n.contains(el) || (iframe && n === iframe)))
            if (removed) {
                this.#show(...this.#content)
                return
            }

            if (el.classList.contains(CHROME_HIDE_CLS)) {
                el.classList.remove(CHROME_HIDE_CLS)
            }
            if (el.style.display === 'none') {
                el.style.display = 'block'
            }
            if (iframe?.classList.contains(CHROME_HIDE_CLS)) {
                iframe.classList.remove(CHROME_HIDE_CLS)
            }
            if (iframe?.style.display === 'none' || iframe?.style.visibility === 'hidden') {
                this.#show(...this.#content)
            }
        })
    }

    #observeTargets() {
        if (!this.#observer || !this.#el) return
        this.#observer.disconnect()
        this.#observer.observe(document.body, { childList: true })
        this.#el.shadowRoot && this.#observer.observe(this.#el.shadowRoot, { childList: true })
        this.#observer.observe(this.#el, { attributes: true, attributeFilter: ['style', 'class'] })
        this.#iframe && this.#observer.observe(this.#iframe, { attributes: true, attributeFilter: ['style', 'class'] })
    }

    async #initFrame(): Promise<void> {
        const root = await this.#prepareRoot()
        if (!root) return
        const existing = root.querySelector('iframe')
        if (existing instanceof HTMLIFrameElement) {
            if (isValidFrame(existing)) {
                this.#iframe = existing
                this.#batchRequest()
                return
            }
            existing.remove()
        }
        const iframe = document.createElement('iframe')
        iframe.src = `${MODAL_URL}?url=${encodeURIComponent(this.location.url)}`
        iframe.style.width = '100vw'
        iframe.style.height = '100vh'
        iframe.style.border = 'none'
        root.append(iframe)

        return new Promise(resolve => iframe.onload = async () => {
            if (this.#iframe && this.#iframe !== iframe) {
                return resolve()
            }
            if (!isValidFrame(iframe) && this.#content) {
                void this.#show(...this.#content)
                return resolve(undefined)
            }

            this.#iframe = iframe
            this.#batchRequest()
            resolve(undefined)
        })
    }

    #batchRequest() {
        for (const params of this.#reqQueue) {
            this.#bridge.request(...params).catch(() => { })
        }
        this.#reqQueue = []
    }

    async #prepareRoot(): Promise<ShadowRoot | null> {
        const inner = (): ShadowRoot | null => {
            const exist = this.#el ?? document.querySelector(TAG_NAME)
            if (exist instanceof HTMLElement) {
                this.#el = exist
                if (!document.body.contains(exist)) {
                    document.body.appendChild(exist)
                }
                return exist.shadowRoot
            }
            this.#el = createRootElement()
            document.body.appendChild(this.#el)
            return this.#el.attachShadow({ mode: 'open' })
        }
        if (document.body) return inner()

        return new Promise(resolve => {
            window.addEventListener('load', () => resolve(inner()))
        })
    }

    async #show(reason: Reason) {
        this.#content = [reason]
        const elInvalid = !this.#el || !document.body.contains(this.#el)
        const iframeInvalid = !this.#iframe || !this.#iframe.isConnected || !isValidFrame(this.#iframe)
        if (elInvalid || iframeInvalid) {
            this.#el = undefined
            this.#iframe = undefined
            await this.#initFrame()
        }
        this.#observeTargets()

        if (!this.#el) {
            await this.#initFrame()
        } else if (!document.body.contains(this.#el)) {
            document.body.appendChild(this.#el)
        }

        this.#el && (this.#el.style.visibility = 'visible')
        await this.#sl.lock()
        this.#iframe && (this.#iframe.style.visibility = 'visible')
        this.#notify('reason', reason)
    }

    #hide() {
        this.#content = undefined
        this.#observer?.disconnect()
        this.#el && (this.#el.style.visibility = 'hidden')
        this.#sl.unlock()
        this.#iframe && (this.#iframe.style.visibility = 'hidden')
        this.#notify('reason', undefined)
    }
}

export default ModalManager
