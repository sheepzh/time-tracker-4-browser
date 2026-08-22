import { getIconUrl } from '@api/chrome/runtime'

export const FOCUS_SOUND_URL = 'static/sounds/relentless.wav'

export const FOCUS_POPUP_DURATION_MS = 3000

export type FocusSoundNotice = {
    title: string
    message: string
}

const POPUP_ID = '__TIMER_FOCUS_NOTICE_POPUP__'

function mountStyle(el: HTMLElement, style: Partial<CSSStyleDeclaration>) {
    Object.assign(el.style, style)
}

function resolveFocusPopupTheme(): {
    backgroundColor: string
    border: string
    boxShadow: string
    titleColor: string
    messageColor: string
} {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
    // Use colors opposite to the browser color scheme for contrast.
    const inverseDark = !prefersDark
    return inverseDark
        ? {
            backgroundColor: '#1D1E1F',
            border: '1px solid #4c4d4f',
            boxShadow: '0 8px 28px rgba(0, 0, 0, .55)',
            titleColor: '#E5EAF3',
            messageColor: '#CFD3DC',
        }
        : {
            backgroundColor: '#ffffff',
            border: '1px solid #dcdfe6',
            boxShadow: '0 8px 28px rgba(0, 0, 0, .18)',
            titleColor: '#303133',
            messageColor: '#606266',
        }
}

function appendToPage(el: HTMLElement): void {
    const mount = () => (document.body ?? document.documentElement).appendChild(el)
    if (document.body) {
        mount()
    } else {
        document.addEventListener('DOMContentLoaded', mount, { once: true })
    }
}

export function showFocusPopup({ title, message }: FocusSoundNotice): void {
    document.getElementById(POPUP_ID)?.remove()

    const theme = resolveFocusPopupTheme()
    const el = document.createElement('div')
    el.id = POPUP_ID
    mountStyle(el, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: '2147483647',
        display: 'flex',
        alignItems: 'center',
        width: '360px',
        minHeight: '88px',
        padding: '16px 20px',
        borderRadius: '10px',
        boxSizing: 'border-box',
        opacity: '1',
        transform: 'translateY(0)',
        transition: 'opacity .25s ease, transform .25s ease',
        overflowWrap: 'break-word',
        pointerEvents: 'none',
        backgroundColor: theme.backgroundColor,
        border: theme.border,
        boxShadow: theme.boxShadow,
    })

    const icon = document.createElement('img')
    icon.width = 40
    icon.height = 40
    icon.src = getIconUrl()
    icon.style.flexShrink = '0'
    el.append(icon)

    const group = document.createElement('div')
    mountStyle(group, { flex: '1', minWidth: '0', marginInlineStart: '14px' })

    const titleEl = document.createElement('div')
    titleEl.textContent = title
    mountStyle(titleEl, {
        fontWeight: '700',
        fontSize: '17px',
        lineHeight: '26px',
        color: theme.titleColor,
    })
    group.append(titleEl)

    const messageEl = document.createElement('div')
    messageEl.textContent = message
    mountStyle(messageEl, {
        marginTop: '6px',
        fontSize: '14px',
        lineHeight: '22px',
        color: theme.messageColor,
    })
    group.append(messageEl)

    el.append(group)
    appendToPage(el)

    window.setTimeout(() => {
        el.style.opacity = '0'
        el.style.transform = 'translateY(12px)'
        window.setTimeout(() => el.remove(), 250)
    }, FOCUS_POPUP_DURATION_MS)
}

export function playFocusSound(notice: FocusSoundNotice): boolean {
    if (!notice?.title) return false
    showFocusPopup(notice)
    return true
}
