import { getUrl } from '@api/chrome/runtime'
import { IS_MV3 } from '@util/constant/environment'
import { FOCUS_SOUND_URL } from '@util/focus-sound'

const OFFSCREEN_PLAY_PATH = 'static/offscreen/play.html'

let creatingOffscreen: Promise<void> | undefined

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

async function hasOffscreenDocument(): Promise<boolean> {
    if (!chrome.offscreen) return false
    if (chrome.offscreen.hasDocument) {
        return chrome.offscreen.hasDocument()
    }
    return false
}

async function closeOffscreenDocument(): Promise<void> {
    if (!IS_MV3 || !chrome.offscreen) return
    if (!(await hasOffscreenDocument())) return
    try {
        await chrome.offscreen.closeDocument()
    } catch {
        // ignore
    }
    await sleep(100)
}

/**
 * Create a fresh offscreen document that auto-plays audio on load.
 * Mirrors the MV3 pattern: Service Worker cannot play audio directly.
 */
async function openOffscreenPlayer(src: string): Promise<void> {
    if (!IS_MV3 || !chrome.offscreen) {
        throw new Error('offscreen API unavailable')
    }

    await closeOffscreenDocument()

    const url = `${OFFSCREEN_PLAY_PATH}?src=${encodeURIComponent(src)}`
    if (creatingOffscreen) {
        await creatingOffscreen
        await closeOffscreenDocument()
    }

    creatingOffscreen = chrome.offscreen.createDocument({
        url,
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Play focus and pomodoro completion notification sound',
    }).finally(() => {
        creatingOffscreen = undefined
    })

    await creatingOffscreen
}

export async function prewarmOffscreenAudio(): Promise<void> {
    // Intentionally no-op: the player page auto-plays on load.
}

export async function playFocusSoundOffscreen(): Promise<boolean> {
    if (!IS_MV3 || !chrome.offscreen) return false

    const src = getUrl(FOCUS_SOUND_URL)

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            await openOffscreenPlayer(src)
            return true
        } catch (err) {
            console.warn('[focus-sound] offscreen playback attempt failed', attempt + 1, err)
            await closeOffscreenDocument()
        }
    }

    return false
}
