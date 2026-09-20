import { initDarkTheme } from "@pages/util/dark-mode"
import { isRequest, type FrameResponse } from "@popup/types"
import { injectSkeletonCss } from './style/skeleton'

function injectFrame() {
    const iframe = document.createElement('iframe')
    iframe.src = 'popup.html'
    iframe.style.display = 'none'
    document.body.append(iframe)

    window.onmessage = ({ data: evData, source }: MessageEvent) => {
        if (!isRequest(evData)) return
        const { stamp, data } = evData
        if (data !== 'themeInitialized') return

        iframe.style.display = 'block'
        source?.postMessage?.({ stamp } satisfies FrameResponse)
    }
}

/**
 * Skeleton screen of popup
 */
async function main() {
    // Calculate the latest mode
    initDarkTheme()
    injectSkeletonCss()
    // Resize after init theme
    document.body.style.width = '766px'
    document.body.style.height = '596px'

    setTimeout(() => injectFrame())
}

main()