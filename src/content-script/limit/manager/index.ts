import { getUrl } from '@api/chrome/runtime'
import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import { ModalBridge } from '../modal/bridge'
import { VisitProcessor } from '../processor'
import type { Reason } from '../types'
import DelayCoordinator from './delay-coordinator'
import ScreenLocker from './screen-locker'
import LimitState from './state'

const MODAL_URL = getUrl('static/limit.html')
const MSG_ORIGIN = new URL(MODAL_URL).origin
const TAG_NAME = 'extension-time-tracker-overlay'

class RootElement extends HTMLElement { }

function createRootElement(): RootElement {
    const element = document.createElement(TAG_NAME) as RootElement
    element.style.display = 'block'
    element.style.position = 'fixed'
    element.style.inset = '0'
    element.style.width = '100vw'
    element.style.height = '100vh'
    element.style.zIndex = String(Number.MAX_SAFE_INTEGER)
    return element
}

class ModalManager {
    #el?: RootElement
    #iframe?: HTMLIFrameElement
    #sl = new ScreenLocker()
    #bridge: ModalBridge

    constructor(private location: LocationWatcher) {
        this.#bridge = new ModalBridge(MSG_ORIGIN, () => this.#iframe?.contentWindow ?? undefined)

        location.onChange(({ nextUrl }) => this.#notifyUrl(nextUrl))
    }

    init(state: LimitState, delayCoord: DelayCoordinator, visitProcessor: VisitProcessor) {
        this.#bridge
            .register('delay', reason => delayCoord.process(reason))
            // fixme: refactor this, this action should be handled by the focus processor
            .register('stop', () => trySendMsg2Runtime('focus.action', 'stop'))

        this.#notifyUrl(this.location.url)

        visitProcessor.onChange(time => this.#notifyVisitTime(time))
        state.onChange(current => current ? this.#show(current) : this.#hide())
    }

    #notifyUrl(url: string): void {
        if (!this.#iframe?.contentWindow) return
        this.#bridge.request('url', url).catch(() => { })
    }

    #notifyVisitTime(time: number): void {
        if (!this.#iframe?.contentWindow) return
        this.#bridge.request('visitTime', time).catch(() => { })
    }

    #notifyReason(reason: Reason | undefined) {
        if (!this.#iframe?.contentWindow) return
        this.#bridge.request('reason', reason).catch(() => { })
    }

    async #initFrame(): Promise<void> {
        const root = await this.prepareRoot()
        if (!root) return
        const iframe = document.createElement('iframe')
        iframe.src = `${MODAL_URL}?url=${encodeURIComponent(this.location.url)}`
        iframe.style.width = '100vw'
        iframe.style.height = '100vh'
        iframe.style.border = 'none'
        root.append(iframe)

        this.#iframe = iframe

        return new Promise(resolve => iframe.onload = () => resolve(undefined))
    }

    private async prepareRoot(): Promise<ShadowRoot | null> {
        const inner = (): ShadowRoot | null => {
            const exist = this.#el ?? document.querySelector(TAG_NAME) as RootElement
            if (exist) {
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
        if (!this.#el) {
            await this.#initFrame()
        } else if (!document.body.contains(this.#el)) {
            document.body.appendChild(this.#el)
        }

        this.#el && (this.#el.style.visibility = 'visible')
        await this.#sl.lock()
        this.#iframe && (this.#iframe.style.visibility = 'visible')
        this.#notifyReason(reason)
    }

    #hide() {
        this.#el && (this.#el.style.visibility = 'hidden')
        this.#sl.unlock()
        this.#iframe && (this.#iframe.style.visibility = 'hidden')
        this.#notifyReason(undefined)
    }
}

export default ModalManager
