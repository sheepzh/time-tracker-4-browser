import { t } from '@cs/locale'
import { formatPeriodCommon, MILL_PER_MINUTE, MILL_PER_SECOND } from '@util/time'
import { mountStyle } from '../style'
import type { CountdownData, Dimension, RemainingItem } from './types'

const CONTAINER_CLS = 'countdown-container'
const TOOLTIP_CLS = 'tooltip'
const ICON_SIZE = 40
const HALF_SIZE = ICON_SIZE / 2
const STROKE_WIDTH = 3
const RADIUS = (ICON_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Stage = 'enough' | 'warning' | 'short'

type Edge = 'left' | 'right'

type Position = { x: number, y: number }

const DIMENSION_LABELS: Record<Dimension, string> = {
    daily: t(msg => msg.calendar.range.today),
    weekly: t(msg => msg.calendar.range.thisWeek),
    visit: t(msg => msg.limit.thisSession),
}

const STAGE_COLORS: Record<Stage, string> = {
    enough: '#67C23A',
    warning: '#E6A23C',
    short: '#F56C6C',
}



abstract class VNode<State, K extends keyof HTMLElementTagNameMap> {
    el: HTMLElementTagNameMap[K]

    constructor(protected state: State | null = null) {
        this.el = this.init()
    }

    protected abstract init(): HTMLElementTagNameMap[K]

    render(state: State) {
        if (this.sameAsCurrent(state)) return
        this.doRender(this.state = state)
    }

    protected sameAsCurrent(newState: State) {
        return newState === this.state
    }

    protected abstract doRender(state: State): void
}

function getStage(remaining: number, total: number): Stage {
    const progress = remaining / total
    if (progress < 0.2 || remaining < 30 * MILL_PER_SECOND) return 'short'
    if (progress < 0.5 || remaining < 2 * MILL_PER_MINUTE) return 'warning'
    return 'enough'
}

function getCenterText(remaining: number): string {
    const seconds = Math.ceil(remaining / MILL_PER_SECOND)
    if (seconds <= 0) return '0s'
    const hours = Math.floor(seconds / 3600)
    if (hours > 0) return `${hours}h`
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) return `${minutes}m`
    return `${seconds}s`
}

function createSvgEl<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, unknown>): SVGElementTagNameMap[K] {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
    Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, String(v)))
    return el
}

function createSvgRing() {
    const svg = createSvgEl('svg', {
        width: ICON_SIZE, height: ICON_SIZE,
        viewBox: `0 0 ${ICON_SIZE} ${ICON_SIZE}`,
    })

    const bgCircle = createSvgEl('circle', {
        cx: HALF_SIZE, cy: HALF_SIZE, r: RADIUS, fill: 'none',
        stroke: 'rgba(128, 128, 128, 0.2)', 'stroke-width': STROKE_WIDTH,
    })
    svg.append(bgCircle)

    const circle = createSvgEl('circle', {
        cx: HALF_SIZE, cy: HALF_SIZE, r: RADIUS, fill: 'none',
        'stroke-width': STROKE_WIDTH, 'stroke-linecap': 'round', 'stroke-dasharray': CIRCUMFERENCE,
        transform: `rotate(-90 ${HALF_SIZE} ${HALF_SIZE})`,
    })
    svg.append(circle)

    return { svg, circle }
}

class CenterText extends VNode<string, 'span'> {
    protected init(): HTMLSpanElement {
        const el = document.createElement('span')
        mountStyle(el, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '11px',
            color: '#303133',
            userSelect: 'none',
        })
        return el
    }

    protected doRender(state: string): void {
        this.el.innerText = state
    }
}

function createTooltip() {
    const el = document.createElement('div')
    el.classList.add(TOOLTIP_CLS)
    return el
}

function updateTooltip(el: HTMLDivElement, items: RemainingItem[]) {
    el.innerHTML = ''
    if (!items.length) return

    items.forEach(({ dimension, name, remaining }) => {
        const row = document.createElement('div')
        mountStyle(row, {
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            whiteSpace: 'nowrap',
            lineHeight: '1.5',
        })

        const label = document.createElement('span')
        label.innerText = `${name} · ${DIMENSION_LABELS[dimension]}`
        mountStyle(label, { opacity: '0.98' })

        const value = document.createElement('span')
        value.innerText = formatPeriodCommon(remaining, true)
        mountStyle(value, { fontWeight: 'bold' })

        row.append(label, value)
        el.append(row)
    })
}

function createContainer() {
    const el = document.createElement('div')
    el.classList.add(CONTAINER_CLS)
    mountStyle(el, {
        position: 'relative',
        width: `${ICON_SIZE}px`,
        height: `${ICON_SIZE}px`,
        borderRadius: '50%',
        cursor: 'grab',
        color: '#303133',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
    })
    return el
}

type IconInstance = {
    el: HTMLElement
    render: (position: Position, data: CountdownData) => void
    destroy: NoArgCallback
}

function createIcon(): IconInstance {
    const el = document.createElement('div')
    mountStyle(el, {
        position: 'fixed',
        zIndex: Number.MAX_SAFE_INTEGER.toString(),
        width: `${ICON_SIZE}px`,
        height: `${ICON_SIZE}px`,
    })

    const shadow = el.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = `
        :host { all: initial; };
        @media print { :host { display: none !important; } }
        @media (prefers-reduced-motion: reduce) {
            .pulse { animation: none !important; }
            .${CONTAINER_CLS} { transition: none !important; }
        }
        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4); }
            50% { box-shadow: 0 0 0 6px rgba(245, 108, 108, 0); }
        }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        .edge-left { transform: translateX(${HALF_SIZE}px); }
        .edge-right { transform: translateX(-${HALF_SIZE}px); }
        .${TOOLTIP_CLS} {
            position: absolute;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
            user-select: none;
        }
        .${CONTAINER_CLS}:hover .${TOOLTIP_CLS} { opacity: 1; visibility: visible; }
        .edge-left .${TOOLTIP_CLS} {
            left: calc(100% + 8px);
            right: auto;
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
        }
        .edge-right .${TOOLTIP_CLS} {
            left: auto;
            right: calc(100% + 8px);
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
        }
    `
    shadow.append(style)

    const container = createContainer()
    shadow.append(container)

    const { svg, circle } = createSvgRing()
    container.append(svg)

    const text = new CenterText()
    container.append(text.el)

    const tooltip = createTooltip()
    container.append(tooltip)

    let lastStage: Stage | null = null
    let lastEdge: Edge | null = null

    const render = (position: Position, { remaining, total, all }: CountdownData) => {
        text.render(getCenterText(remaining))
        const stage = getStage(remaining, total)
        const edge = getEdge(position)
        if (stage !== lastStage) {
            lastStage = stage
            circle.setAttribute('stroke', STAGE_COLORS[stage])
            container.classList.toggle('pulse', stage === 'short')
        }

        circle.setAttribute('stroke-dashoffset', String(CIRCUMFERENCE * (1 - remaining / total)))
        if (lastEdge !== edge) {
            lastEdge = edge
            container.classList.remove('edge-left', 'edge-right')
            container.classList.add(`edge-${edge}`)
        }

        updateTooltip(tooltip, all)
    }
    const destroy = () => el.remove()
    return { el, render, destroy }
}

const getViewportSize = () => ({ w: window.innerWidth, h: window.innerHeight })

function clampPosition({ x, y }: Position): Position {
    const { w, h } = getViewportSize()
    return {
        x: Math.max(HALF_SIZE, Math.min(w - HALF_SIZE, x)),
        y: Math.max(HALF_SIZE, Math.min(h - HALF_SIZE, y)),
    }
}

function getEdge(position: Position): Edge {
    const { w } = getViewportSize()
    let { x } = clampPosition(position)
    return x < w - x ? 'left' : 'right'
}

function defaultPosition(): Position {
    const { w, h } = getViewportSize()
    return { x: w, y: h - HALF_SIZE }
}

function snapPosition(position: Position): Position {
    const { w, h } = getViewportSize()
    const { x, y } = clampPosition(position)
    const edge = x < w - x ? 'left' : 'right'
    const clamp = (value: number, max: number) => Math.max(HALF_SIZE, Math.min(max - HALF_SIZE, value))
    const strategies: Record<Edge, () => Position> = {
        left: () => ({ x: 0, y: clamp(y, h) }),
        right: () => ({ x: w, y: clamp(y, h) }),
    }
    return strategies[edge]()
}

const applyPosition = (el: HTMLElement, { x, y }: Position) => mountStyle(el, {
    left: `${x - HALF_SIZE}px`,
    top: `${y - HALF_SIZE}px`,
    right: 'auto',
    bottom: 'auto',
})

const DRAG_THRESHOLD = 5

function initDrag(el: HTMLElement, position: Position, onChange: ArgCallback<Position>) {
    applyPosition(el, position)

    let curr = { ...position }
    let pressed = false
    let dragging = false
    let startX = 0
    let startY = 0
    let pointerStartX = 0
    let pointerStartY = 0

    const onPointerDown = (ev: PointerEvent) => {
        if (ev.button !== 0) return
        ev.preventDefault()
        el.setPointerCapture(ev.pointerId)
        pressed = true
        dragging = false
        startX = curr.x
        startY = curr.y
        pointerStartX = ev.clientX
        pointerStartY = ev.clientY
    }

    const onPointerMove = (ev: PointerEvent) => {
        if (!pressed) return

        const dx = ev.clientX - pointerStartX
        const dy = ev.clientY - pointerStartY

        if (!dragging) {
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return

            dragging = true
            mountStyle(el, { transition: 'none', cursor: 'grabbing' })
        }

        curr = clampPosition({ x: startX + dx, y: startY + dy })
        applyPosition(el, curr)
    }

    const onPointerUp = (ev: PointerEvent) => {
        pressed = false
        el.releasePointerCapture(ev.pointerId)
        mountStyle(el, { transition: '', cursor: '' })

        if (!dragging) return

        dragging = false
        curr = snapPosition(curr)
        applyPosition(el, curr)
        onChange({ ...curr })
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    const onResize = () => {
        curr = snapPosition(curr)
        applyPosition(el, curr)
        onChange({ ...curr })
    }
    window.addEventListener('resize', onResize)

    return () => {
        el.removeEventListener('pointerdown', onPointerDown)
        el.removeEventListener('pointermove', onPointerMove)
        el.removeEventListener('pointerup', onPointerUp)
        el.removeEventListener('pointercancel', onPointerUp)
        window.removeEventListener('resize', onResize)
    }
}

export class CountdownComponent {
    #icon?: IconInstance
    #dragCleanup?: NoArgCallback
    #position: Position = defaultPosition()

    render(data: CountdownData | undefined) {
        data ? this.#show(data) : this.#destroy()
    }

    #show(data: CountdownData) {
        if (!this.#icon) {
            this.#icon = createIcon()
            this.#dragCleanup = initDrag(
                this.#icon.el,
                this.#position,
                pos => this.#position = pos,
            )
            document.body.append(this.#icon.el)
        }
        this.#icon.el.style.display = 'block'
        this.#icon?.render(this.#position, data)
    }

    #destroy() {
        this.#dragCleanup?.()
        this.#dragCleanup = undefined
        this.#icon?.destroy()
        this.#icon = undefined
    }
}