import { t } from "@cs/locale"
import { getIconUrl } from "@api/chrome/runtime"

const containerStyle = (dark: boolean): Partial<CSSStyleDeclaration> => ({
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    width: '330px',
    padding: '14px 26px 14px 13px',
    borderRadius: '8px',
    transition: 'opacity .3s, transform .3s, left .3s, right .3s, top .4s, bottom .3s',
    overflowWrap: 'break-word',
    overflow: 'hidden',
    border: dark ? '1px solid #363637' : '',
    backgroundColor: dark ? '#1D1E1F' : '',
    boxShadow: dark ? '0px 0px 12px rgba(0, 0, 0, .72)' : '',
})

const GROUP_STYLE: Partial<CSSStyleDeclaration> = {
    flex: '1',
    minWidth: '0px',
    marginInline: '13px 8px',
}

const titleStyle = (dark: boolean): Partial<CSSStyleDeclaration> => ({
    fontWeight: '700',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0',
    paddingBottom: '.3rem',
    color: dark ? '#E5EAF3' : '',
})

const contentStyle = (dark: boolean): Partial<CSSStyleDeclaration> => ({
    fontSize: '14px',
    lineHeight: '24px',
    margin: '6px 0 0',
    color: dark ? '#CFD3DC' : '',
})

const closeBtnStyle = (dark: boolean): Partial<CSSStyleDeclaration> => ({
    position: 'absolute',
    top: '18px',
    right: '15px',
    cursor: 'pointer',
    fontSize: '16px',
    height: '1em',
    width: '1em',
    lineHeight: '1em',
    fill: 'current-color',
    color: dark ? '#A3A6AD' : '',
})

function mountStyle(el: HTMLElement, style: Partial<CSSStyleDeclaration>) {
    if (!el || !style) return
    Object.entries(style).forEach(([key, val]) => typeof val === 'string' && el.style.setProperty(key, val))
}

function createIcon(): HTMLImageElement {
    const icon = document.createElement('img')
    icon.width = 32
    icon.height = 32
    icon.src = getIconUrl()
    return icon
}

function createCloseBtn(dark: boolean, onClose: () => void): HTMLElement {
    const btn = document.createElement('i')
    mountStyle(btn, closeBtnStyle(dark))
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 1024 1024')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('fill', 'currentColor')
    path.setAttribute(
        'd',
        'M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 \
        764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 \
        45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z'
    )
    svg.append(path)

    btn.append(svg)

    btn.addEventListener('click', ev => {
        onClose?.()
        ev.stopPropagation()
    })
    return btn
}

function createGroup(dark: boolean, data: timer.limit.ReminderInfo, onClose: () => void): HTMLDivElement {
    const group = document.createElement('div')
    mountStyle(group, GROUP_STYLE)

    const title = document.createElement('h2')
    title.innerText = t(msg => msg.meta.name)
    mountStyle(title, titleStyle(dark))
    group.append(title)

    const content = document.createElement('div')
    mountStyle(content, contentStyle(dark))
    const p = document.createElement('p')
    const duration = data?.duration ?? 'NaN'
    p.innerText = t(msg => msg.limit.reminder, { min: duration })
    p.style.margin = '0'
    content.append(p)
    group.append(content)

    const closeBtn = createCloseBtn(dark, onClose)
    group.append(closeBtn)

    return group
}

export function createComponent(dark: boolean, data: timer.limit.ReminderInfo, onClose: () => void) {
    const el = document.createElement('div')
    mountStyle(el, containerStyle(dark))

    // Icon
    el.append(createIcon())
    // Group
    el.append(createGroup(dark, data, onClose))

    return el
}