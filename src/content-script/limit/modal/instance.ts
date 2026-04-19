import { getRuntimeId, getUrl } from '@api/chrome/runtime'
import { trySendMsg2Runtime } from '@api/sw/common'
import { exitFullscreen, isSameReason } from '../common'
import type { LimitReason, MaskModal } from '../types'
import { ModalBridge } from './bridge'
import { createRootElement, TAG_NAME, type RootElement } from './element'
import type { LimitReasonData } from './types'

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

const TYPE_SORT: { [reason in timer.limit.ReasonType]: number } = {
    PERIOD: 0,
    VISIT: 1,
    DAILY: 2,
    WEEKLY: 3,
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
    url: string
    rootElement: RootElement | undefined
    iframe: HTMLIFrameElement | undefined
    delayHandlers: NoArgCallback[] = [
        () => trySendMsg2Runtime('limit.delay', this.url),
    ]
    reasons: LimitReason[] = []
    reason: LimitReason | undefined
    screenLocker = new ScreenLocker()
    private bridge: ModalBridge

    constructor(url: string) {
        (window as any)['__modal__'] = this
        this.url = url
        this.bridge = new ModalBridge(MSG_ORIGIN, () => this.iframe?.contentWindow ?? undefined)
            .register('visitTime', () => this.reason?.getVisitTime?.() ?? 0)
            .register('delay', () => this.delayHandlers.forEach(handler => handler()))
    }

    addReason(...reasons2Add: LimitReason[]): void {
        reasons2Add = reasons2Add.filter(r => !this.reasons.some(reason => isSameReason(r, reason)))
        if (!reasons2Add.length) return
        this.reasons.push(...reasons2Add)
        // Sort
        this.reasons.sort((a, b) => TYPE_SORT[a.type] - TYPE_SORT[b.type])
        this.refresh()
    }

    removeReason(...reasons2Remove: LimitReason[]): void {
        if (!reasons2Remove?.length) return
        this.reasons = this.reasons?.filter(reason => {
            const anyRemove = reasons2Remove.some(r => isSameReason(reason, r))
            return !anyRemove
        })
        this.refresh()
    }

    removeReasonsByType(...types: timer.limit.ReasonType[]): void {
        if (!types.length) return
        this.reasons = this.reasons.filter(r => !types.includes(r.type))
        this.refresh()
    }

    addDelayHandler(handler: NoArgCallback): void {
        if (this.delayHandlers.includes(handler)) return
        this.delayHandlers.push(handler)
    }

    private refresh() {
        // Change reason in new microtask
        setTimeout(() => {
            const reason = this.reasons[0]
            reason ? this.show(reason) : this.hide()
        })
    }

    private async init(): Promise<void> {
        const root = await this.prepareRoot()
        if (!root) return
        const iframe = document.createElement('iframe')
        iframe.src = `${MODAL_URL}?url=${encodeURIComponent(this.url)}`
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

    private async show(reason: LimitReason) {
        if (!this.rootElement) {
            await this.init()
        }
        await exitFullscreen()
        // Scroll to top
        scrollTo(0, 0)
        pauseAllVideo()
        pauseAllAudio()

        this.rootElement && (this.rootElement.style.visibility = 'visible')
        this.setReason(reason)
        this.screenLocker.lock()
        this.iframe && (this.iframe.style.visibility = 'visible')
    }

    private hide() {
        this.rootElement && (this.rootElement.style.visibility = 'hidden')
        this.screenLocker.unlock()
        this.iframe && (this.iframe.style.visibility = 'hidden')
        this.setReason(undefined)
    }

    private setReason(reason: LimitReason | undefined) {
        if (!this.iframe?.contentWindow) return
        this.reason = reason
        this.bridge.request('reason', extractReason(reason)).catch(() => { })
    }
}

const extractReason = (reason: LimitReason | undefined): LimitReasonData | undefined => {
    if (!reason) return undefined
    const { getVisitTime: _, ...rest } = reason
    return rest
}

export default ModalInstance
