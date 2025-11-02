import { init as initTheme } from "@util/dark-mode"
import { type FrameRequest, type FrameResponse } from "./message"
import { injectSkeletonCss } from './style/skeleton'

function injectFrame() {
    const iframe: HTMLIFrameElement = document.createElement('iframe')
    iframe.src = 'popup.html'
    iframe.style.display = 'none'
    document.body.append(iframe)

    window.onmessage = (ev: MessageEvent) => {
        const { stamp, data } = ev.data as FrameRequest || {}
        if (data !== 'themeInitialized') return

        iframe.style.display = 'block'
        const res: FrameResponse = { stamp }
        ev.source?.postMessage?.(res)
    }
}

/**
 * Skeleton screen of popup
 */
async function main() {
    // Calculate the latest mode
    initTheme()
    injectSkeletonCss()
    // Resize after init theme
    document.body.style.width = '766px'
    document.body.style.height = '596px'

    setTimeout(() => injectFrame())
}

main()