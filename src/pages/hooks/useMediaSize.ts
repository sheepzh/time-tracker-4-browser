import { computed } from "vue"
import { useWindowSize } from "./useWindowSize"

export enum MediaSize {
    xs,
    sm,
    md,
    lg,
    xl,
}

const XS_MAX = 768

const computeMediaSize = (width: number): MediaSize => {
    if (width < XS_MAX) {
        return MediaSize.xs
    } else if (width < 992) {
        return MediaSize.sm
    } else if (width < 1200) {
        return MediaSize.md
    } else if (width < 1920) {
        return MediaSize.lg
    } else {
        return MediaSize.xl
    }
}

export const useMediaSize = () => {
    const winSize = useWindowSize()
    return computed(() => computeMediaSize(winSize.value.w))
}

export const useXsState = () => {
    const winSize = useWindowSize()
    return computed(() => winSize.value.w < XS_MAX)
}

export const listenMediaSizeChange = () => {
    const processMediaSize = () => {
        if (!document?.body) return
        const width = document.body?.clientWidth ?? 0
        if (!width) return
        const mediaSize = computeMediaSize(width)
        const htmlEl = document.getElementsByTagName("html")?.[0]
        if (!htmlEl) return
        htmlEl.setAttribute('data-media-size', MediaSize[mediaSize])
    }
    processMediaSize()
    window.addEventListener('resize', processMediaSize)
    window.addEventListener('pagehide', () => window.removeEventListener('resize', processMediaSize))
    window.addEventListener('pageshow', () => {
        window.removeEventListener('resize', processMediaSize)
        window.addEventListener('resize', processMediaSize)
        processMediaSize()
    })
}