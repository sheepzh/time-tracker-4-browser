import { initDarkTheme } from '@/pages/util/dark-mode'
import { createApp } from 'vue'
import Main from './Main'
import { ModalBridge } from './bridge'
import { provideApp } from './context'

function parsePageUrl(): string {
    const raw = new URLSearchParams(window.location.search).get('url')
    if (!raw) return ''
    try {
        return decodeURIComponent(raw)
    } catch {
        return raw
    }
}

function main() {
    initDarkTheme()

    const bridge = new ModalBridge('*', () => window.parent)
    const app = createApp(Main)
    provideApp(app, bridge, parsePageUrl())

    const el = document.createElement('div')
    document.body.append(el)
    el.id = 'app'
    app.mount(el)
}

main()
