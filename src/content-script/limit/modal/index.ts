import { getUrl, sendMsg2Runtime } from '@api/chrome/runtime'
import optionService from '@service/option-service'
import { init as initTheme, toggle } from '@util/dark-mode'
import { createApp, Ref, type App } from 'vue'
import { exitFullscreen, isSameReason, type LimitReason, type MaskModal } from '../common'
import { TAG_NAME, type RootElement } from '../element'
import Main from './Main'
import { provideDelayHandler, provideReason } from './context'

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

const createHeader = () => {
    const header = document.createElement('header')
    // Style script
    const style = document.createElement('link')
    style.type = 'text/css'
    style.rel = 'stylesheet'
    style.href = getUrl('content_scripts.css')
    header.append(style)
    return header
}

class ScreenLocker {
    private beforeOverflow: string | undefined

    private doLock() {
        const ele = document?.documentElement
        this.beforeOverflow = undefined
        if (ele) {
            this.beforeOverflow = ele.style.overflow
            document.documentElement.style.setProperty('overflow', 'hidden', 'important')
        }
    }

    lock() {
        this.doLock()
        // Re-lock after 200ms to avoid being unlocked by the original website
        setTimeout(() => this.doLock(), 200)
    }

    unlock() {
        if (document?.documentElement) {
            document.documentElement.style.overflow = this.beforeOverflow ?? ''
        }
    }
}

class ModalInstance implements MaskModal {
    url: string
    rootElement: RootElement | undefined
    body: HTMLBodyElement | undefined
    delayHandlers: (() => void)[] = [
        () => sendMsg2Runtime('cs.moreMinutes', this.url),
    ]
    reasons: LimitReason[] = []
    reason: Ref<LimitReason | undefined> | undefined
    app: App<Element> | undefined
    screenLocker = new ScreenLocker()

    constructor(url: string) {
        (window as any)['__modal__'] = this
        this.url = url
    }

    addReason(...reasons2Add: LimitReason[]): void {
        reasons2Add = reasons2Add.filter(r => {
            const anyExist = this.reasons?.some(reason => isSameReason(r, reason))
            return !anyExist
        })
        if (!reasons2Add?.length) return
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
        if (!types?.length) return
        this.reasons = this.reasons?.filter(r => !types?.includes(r.type))
        this.refresh()
    }

    addDelayHandler(handler: () => void): void {
        if (!handler) return
        if (this.delayHandlers?.includes(handler)) return
        this.delayHandlers?.push(handler)
    }

    private refresh() {
        setTimeout(() => {
            // update vue ref in another micro task
            const reason = this.reasons?.[0]
            reason ? this.show(reason) : this.hide()
        })
    }

    private async init() {
        // 1. Create mask element
        const root = await this.prepareRoot()
        const html = document.createElement('html')
        root?.append(html)

        // header
        const header = createHeader()
        html.append(header)

        // body
        this.body = document.createElement('body')
        html.append(this.body)

        // 2. Init dark mode
        initTheme(html)
        optionService.isDarkMode().then(val => toggle(val, html))

        // 3. Init vue app instance
        this.initApp()
    }

    private initApp() {
        this.app = createApp(Main)
        this.reason = provideReason(this.app)
        provideDelayHandler(this.app, () => this.delayHandlers?.forEach(h => h?.()))
        this.body && this.app.mount(this.body)
    }

    private async prepareRoot(): Promise<ShadowRoot | null> {
        const inner = (): ShadowRoot | null => {
            const exist = this.rootElement || document.querySelector(TAG_NAME) as RootElement
            if (exist) {
                this.rootElement = exist
                return exist.shadowRoot
            }
            this.rootElement = document.createElement(TAG_NAME) as RootElement
            document.body.appendChild(this.rootElement)
            return this.rootElement.attachShadow({ mode: 'open' })
        }
        if (document.body) {
            return inner()
        } else {
            return new Promise(resolve => {
                window.addEventListener('load', () => resolve(inner()))
            })
        }
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
        this.reason && (this.reason.value = reason)
        this.screenLocker.lock()
        this.body && (this.body.style.display = 'block')
    }

    private hide() {
        this.rootElement && (this.rootElement.style.visibility = 'hidden')
        this.screenLocker.unlock()
        this.body && (this.body.style.display = 'none')
        this.reason && (this.reason.value = undefined)
    }
}

export default ModalInstance
