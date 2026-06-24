import { getRuntimeId, getUrl } from '@api/chrome/runtime'
import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import { exitFullscreen, isSameReason } from '../common'
import type { MaskModal, Reason, ReasonType } from '../types'
import { ModalBridge } from './bridge'
import { createRootElement, TAG_NAME, type RootElement } from './element'

const MODAL_URL = getUrl('static/limit.html')
const MSG_ORIGIN = new URL(MODAL_URL).origin

function pauseAllVideo(): void {
    const elements = document?.getElementsByTagName('video')
    if (!elements) return
    Array.from(elements).forEach(video => {
        try {
            video?.pause?.()
        } catch { }
    })
}

function pauseAllAudio(): void {
    const elements = document?.getElementsByTagName('audio')
    if (!elements) return
    Array.from(elements).forEach(audio => {
        try {
            audio?.pause?.()
        } catch { }
    })
}

const TYPE_SORT: Record<ReasonType, number> = {
    FOCUS: -1,
    PERIOD: 0,
    VISIT: 1,
    DAILY: 2,
    WEEKLY: 3,
}

class ReasonQueue {
    #items: Reason[] = []
    #pending = false

    constructor(private onChange: ArgCallback<Reason | undefined>) { }

    get current(): Reason | undefined {
        return this.#items[0]
    }

    get all(): Reason[] {
        return this.#items
    }

    add(...reasons: Reason[]): void {
        const filtered = reasons.filter(r => !this.#items.some(item => isSameReason(item, r)))
        if (!filtered.length) return
        this.#items.push(...filtered)
        this.#items.sort((a, b) => TYPE_SORT[a.type] - TYPE_SORT[b.type])
        this.#notify()
    }

    remove(...reasons: Reason[]): void {
        if (!reasons.length) return
        this.#items = this.#items.filter(item => !reasons.some(r => isSameReason(item, r)))
        this.#notify()
    }

    removeByType(...types: ReasonType[]): void {
        if (!types.length) return
        this.#items = this.#items.filter(item => !types.includes(item.type))
        this.#notify()
    }

    #notify() {
        if (this.#pending) return
        this.#pending = true
        setTimeout(() => {
            this.#pending = false
            this.onChange(this.current)
        })
    }
}

class ScreenLocker {
    private styleId = `time-tracker-style-${getRuntimeId()}`
    private lockedCls = `time-tracker-locked-${getRuntimeId()}`

    lock() {
        this.insertStyle()
        document?.documentElement?.classList?.add?.(this.lockedCls)
    }

    unlock() {
        document?.documentElement?.classList?.remove(this.lockedCls)
    }

    private insertStyle() {
        if (!document) return
        if (document.getElementById(this.styleId)) return
        const style = document.createElement('style')
        style.id = this.styleId
        const css = `
            .${this.lockedCls} {
                overflow: hidden !important;
            }
        `
        style.appendChild(document.createTextNode(css))
        document.head?.appendChild(style)
    }
}

class ModalInstance implements MaskModal {
    rootElement: RootElement | undefined
    iframe: HTMLIFrameElement | undefined
    delayHandlers: NoArgCallback[] = [
        () => trySendMsg2Runtime('limit.delay', this.location.url),
    ]
    reason: Reason | undefined
    screenLocker = new ScreenLocker()
    #rq: ReasonQueue
    #bridge: ModalBridge

    constructor(private location: LocationWatcher) {
        (window as any)['__modal__'] = this
        this.#rq = new ReasonQueue(current => current ? this.show(current) : this.hide())
        this.#bridge = new ModalBridge(MSG_ORIGIN, () => this.iframe?.contentWindow ?? undefined)
            .register('delay', () => this.delayHandlers.forEach(handler => handler()))
        location.onChange(({ nextUrl }) => {
            this.iframe?.contentWindow && this.#bridge.request('url', nextUrl).catch(() => { })
        })
    }

    get reasons(): Reason[] {
        return this.#rq.all
    }

    addReason(...reasons: Reason[]): void {
        this.#rq.add(...reasons)
    }

    removeReason(...reasons: Reason[]): void {
        this.#rq.remove(...reasons)
    }

    removeReasonsByType(...types: ReasonType[]): void {
        this.#rq.removeByType(...types)
    }

    addDelayHandler(handler: NoArgCallback): void {
        if (this.delayHandlers.includes(handler)) return
        this.delayHandlers.push(handler)
    }

    syncVisitTime(time: number): void {
        if (!this.iframe?.contentWindow) return
        this.#bridge.request('visitTime', time).catch(() => { })
    }

    private async init(): Promise<void> {
        const root = await this.prepareRoot()
        if (!root) return
        const iframe = document.createElement('iframe')
        iframe.src = `${MODAL_URL}?url=${encodeURIComponent(this.location.url)}`
        iframe.style.width = '100vw'
        iframe.style.height = '100vh'
        iframe.style.border = 'none'
        root.append(iframe)

        this.iframe = iframe

        return new Promise(resolve => iframe.onload = () => resolve(undefined))
    }

    private async prepareRoot(): Promise<ShadowRoot | null> {
        const inner = (): ShadowRoot | null => {
            const exist = this.rootElement ?? document.querySelector(TAG_NAME) as RootElement
            if (exist) {
                this.rootElement = exist
                if (!document.body.contains(exist)) {
                    document.body.appendChild(exist)
                }
                return exist.shadowRoot
            }
            this.rootElement = createRootElement()
            document.body.appendChild(this.rootElement)
            return this.rootElement.attachShadow({ mode: 'open' })
        }
        if (document.body) return inner()

        return new Promise(resolve => {
            window.addEventListener('load', () => resolve(inner()))
        })
    }

    private async show(reason: Reason) {
        if (!this.rootElement) {
            await this.init()
        } else if (!document.body.contains(this.rootElement)) {
            document.body.appendChild(this.rootElement)
        }
        await exitFullscreen()
        pauseAllVideo()
        pauseAllAudio()

        this.rootElement && (this.rootElement.style.visibility = 'visible')
        this.screenLocker.lock()
        this.iframe && (this.iframe.style.visibility = 'visible')
        this.setReason(reason)
    }

    private hide() {
        this.rootElement && (this.rootElement.style.visibility = 'hidden')
        this.screenLocker.unlock()
        this.iframe && (this.iframe.style.visibility = 'hidden')
        this.setReason(undefined)
    }

    private setReason(reason: Reason | undefined) {
        if (!this.iframe?.contentWindow) return
        this.reason = reason
        this.#bridge.request('reason', reason).catch(() => { })
    }
}

export default ModalInstance
