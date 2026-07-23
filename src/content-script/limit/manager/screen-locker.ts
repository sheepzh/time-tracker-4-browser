import { getRuntimeId } from '@api/chrome/runtime'
import { exitFullscreen } from '../common'

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

class ScreenLocker {
    static #styleId = `time-tracker-style-${getRuntimeId()}`
    static #lockedCls = `time-tracker-locked-${getRuntimeId()}`

    async lock() {
        await exitFullscreen()
        pauseAllVideo()
        pauseAllAudio()

        this.insertStyle()
        document?.documentElement?.classList?.add?.(ScreenLocker.#lockedCls)
    }

    unlock() {
        document?.documentElement?.classList?.remove(ScreenLocker.#lockedCls)
    }

    private insertStyle() {
        if (!document) return
        if (document.getElementById(ScreenLocker.#styleId)) return
        const style = document.createElement('style')
        style.id = ScreenLocker.#styleId
        const css = `
            .${ScreenLocker.#lockedCls} {
                overflow: hidden !important;
            }
        `
        style.appendChild(document.createTextNode(css))
        document.head?.appendChild(style)
    }
}

export default ScreenLocker