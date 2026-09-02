import { t } from '@cs/locale'
import { formatPeriodCommon, MILL_PER_MINUTE, MILL_PER_SECOND } from '@util/time'
import { mountStyle } from '../style'
import type { CountdownData, Dimension, RemainingData } from './types'

const CONTAINER_CLS = 'countdown-container'
const TOOLTIP_CLS = 'tooltip'
const ICON_SIZE = 40
const HALF_SIZE = ICON_SIZE / 2
const STROKE_WIDTH = 3
const RADIUS = (ICON_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const TOOLTIP_MAX_WIDTH = 240
const TOOLTIP_ROW_HEIGHT = 18
const TOOLTIP_DIVIDER_HEIGHT = 13
const TOOLTIP_PADDING = 16
const VIEWPORT_MARGIN = 4

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

abstract class VNode<State, E extends Element> {
    el: E
    state: State | null = null

    constructor() {
        this.el = this.init()
    }

    protected abstract init(): E

    render(state: State) {
        if (this.sameAsCurrent(state)) return
        this.doRender(state, this.state)
        this.state = state
    }

    protected sameAsCurrent(newState: State) {
        return newState === this.state
    }

    protected abstract doRender(state: State, last: State | null): void
}

type RingState = { progress: number, stage: Stage }

class ProgressRing extends VNode<RingState, SVGSVGElement> {
    private circle?: SVGCircleElement

    protected init(): SVGSVGElement {
        const svg = createSvgEl('svg', {
            width: ICON_SIZE, height: ICON_SIZE,
            viewBox: `0 0 ${ICON_SIZE} ${ICON_SIZE}`,
        })
        const bgCircle = createSvgEl('circle', {
            cx: HALF_SIZE, cy: HALF_SIZE, r: RADIUS, fill: 'none',
            stroke: 'rgba(128, 128, 128, 0.2)', 'stroke-width': STROKE_WIDTH,
        })
        svg.append(bgCircle)

        this.circle = createSvgEl('circle', {
            cx: HALF_SIZE, cy: HALF_SIZE, r: RADIUS, fill: 'none',
            'stroke-width': STROKE_WIDTH, 'stroke-linecap': 'round', 'stroke-dasharray': CIRCUMFERENCE,
            transform: `rotate(-90 ${HALF_SIZE} ${HALF_SIZE})`,
        })
        svg.append(this.circle)

        return svg
    }

    protected sameAsCurrent(newState: RingState): boolean {
        return newState.progress === this.state?.progress && newState.stage === this.state.stage
    }

    protected doRender(state: RingState, last: RingState | null): void {
        const { circle } = this
        if (!circle) return
        const { stage, progress } = state
        if (state.stage !== last?.stage) {
            circle.setAttribute('stroke', STAGE_COLORS[stage])
        }
        if (progress !== last?.progress) {
            circle.setAttribute('stroke-dashoffset', String(CIRCUMFERENCE * (1 - progress / 100)))
        }
    }
}

class CenterText extends VNode<string, HTMLSpanElement> {
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

class TooltipNode extends VNode<RemainingData[], HTMLDivElement> {
    #visible = false
    #edge: Edge = 'right'

    constructor(hoverTarget: HTMLElement) {
        super()
        hoverTarget.addEventListener('mouseenter', () => {
            this.#visible = true
            this.state !== null && this.doRender(this.state)
        })
        hoverTarget.addEventListener('mouseleave', () => this.#visible = false)
    }

    set edge(edge: Edge) {
        if (edge === this.#edge) return
        this.el.classList.remove(`tooltip-${this.#edge}`)
        this.el.classList.add(`tooltip-${edge}`)
        this.#edge = edge
    }

    set y(y: number) {
        const state = this.state
        const rowCount = state?.length ?? 0
        const dividers = Math.max(0, rowCount - 1)
        const height = TOOLTIP_PADDING + rowCount * TOOLTIP_ROW_HEIGHT + dividers * TOOLTIP_DIVIDER_HEIGHT
        const { h } = getViewportSize()
        const centeredTop = y - height / 2
        const clampedTop = Math.max(VIEWPORT_MARGIN, Math.min(h - VIEWPORT_MARGIN - height, centeredTop))
        mountStyle(this.el, { top: `${clampedTop - (y - HALF_SIZE)}px`, transform: 'transformY(0)' })
    }

    render(state: RemainingData[]): void {
        if (!this.#visible) {
            this.state = state
            return
        }
        super.render(state)
    }

    protected init(): HTMLDivElement {
        const el = document.createElement('div')
        el.classList.add(TOOLTIP_CLS, 'tooltip-right')
        return el
    }

    protected sameAsCurrent(_any: RemainingData[]): boolean {
        return true
    }

    protected doRender(state: RemainingData[]): void {
        const el = this.el
        el.innerHTML = ''
        if (!state.length) return

        const table = document.createElement('table')
        mountStyle(table, {
            borderCollapse: 'collapse',
            width: '100%',
            tableLayout: 'auto',
        })
        state.forEach(({ ruleName, items }, ruleIdx) => {
            items.forEach((item, idx) => {
                const row = document.createElement('tr')
                mountStyle(row, { lineHeight: '1.5' })

                if (!idx) {
                    const nameCell = document.createElement('td')
                    nameCell.innerText = ruleName
                    nameCell.rowSpan = items.length
                    mountStyle(nameCell, {
                        opacity: '0.98',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '120px',
                        padding: '0 12px 0 0',
                        verticalAlign: 'middle',
                    })
                    row.append(nameCell)
                }

                const dimensionCell = document.createElement('td')
                dimensionCell.innerText = DIMENSION_LABELS[item.dimension]
                mountStyle(dimensionCell, {
                    opacity: '0.98',
                    whiteSpace: 'nowrap',
                    padding: '0 12px 0 0',
                })

                const valueCell = document.createElement('td')
                valueCell.innerText = formatPeriodCommon(item.remaining, true)
                mountStyle(valueCell, {
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                    padding: '0',
                })

                row.append(dimensionCell, valueCell)
                table.append(row)
            })

            if (ruleIdx < state.length - 1) {
                const dividerRow = document.createElement('tr')
                const dividerCell = document.createElement('td')
                dividerCell.colSpan = 3
                const line = document.createElement('div')
                mountStyle(line, {
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                    margin: '6px 0',
                    height: '0',
                })
                dividerCell.append(line)
                dividerRow.append(dividerCell)
                table.append(dividerRow)
            }
        })

        el.append(table)
    }
}

class Container extends VNode<Edge, HTMLElement> {
    protected init(): HTMLElement {
        const el = document.createElement('div')
        el.classList.add(CONTAINER_CLS)
        mountStyle(el, {
            position: 'relative',
            width: `${ICON_SIZE}px`, height: `${ICON_SIZE}px`,
            borderRadius: '50%',
            cursor: 'grab',
            color: '#303133',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
        })
        return el
    }

    protected doRender(state: Edge): void {
        this.el.classList.remove('edge-left', 'edge-right')
        this.el.classList.add(`edge-${state}`)
    }
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





type IconInstance = {
    el: HTMLElement
    render: (position: Position, data: CountdownData) => void
    setPosition: ArgCallback<Position>
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
            .pulse::before { animation: none !important; }
            .${CONTAINER_CLS} { transition: none !important; }
        }
        @keyframes pulse-ring {
            0% { transform: scale(0.85); opacity: 1; }
            100% { transform: scale(1.4); opacity: 0; }
        }
        .pulse { position: relative; }
        .pulse::before {
            content: '';
            position: absolute;
            top: -8px; left: -8px; right: -8px; bottom: -8px;
            border-radius: 50%;
            border: 2px solid rgba(245, 108, 108, 0.6);
            animation: pulse-ring 1.5s ease-out infinite;
            pointer-events: none;
            z-index: 1;
        }
        .edge-left { transform: translateX(${HALF_SIZE}px); }
        .edge-right { transform: translateX(-${HALF_SIZE}px); }
        .${TOOLTIP_CLS} {
            position: absolute;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
            user-select: none;
            padding: 8px 12px;
            background-color: rgba(255, 255, 255, 0.95);
            border-radius: 6px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
            font-size: 12px;
            color: #303133;
            min-width: max-content;
            max-width: ${TOOLTIP_MAX_WIDTH}px;
        }
        .${CONTAINER_CLS}:hover .${TOOLTIP_CLS} { opacity: 1; visibility: visible; }
        .tooltip-left {
            left: auto;
            right: calc(100% + 8px);
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
        }
        .tooltip-right {
            left: calc(100% + 8px);
            right: auto;
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
        }
    `
    shadow.append(style)

    const container = new Container()
    shadow.append(container.el)

    const ring = new ProgressRing()
    container.el.append(ring.el)

    const text = new CenterText()
    container.el.append(text.el)

    const tooltip = new TooltipNode(container.el)
    container.el.append(tooltip.el)

    const setPosition = (position: Position) => {
        container.render(getEdge(position))
        tooltip.edge = getTooltipEdge(position)
        tooltip.y = position.y
    }

    const render = (position: Position, { target, all }: CountdownData) => {
        const { remaining, total } = target
        text.render(getCenterText(remaining))
        const stage = getStage(remaining, total)
        const lastStage = ring.state?.stage
        const progress = Math.ceil(remaining / total * 100)
        ring.render({ stage, progress })
        if (stage !== lastStage) {
            container.el.classList.toggle('pulse', stage === 'short')
        }
        setPosition(position)
        tooltip.render(all)
    }
    const destroy = () => el.remove()
    return { el, render, setPosition, destroy }
}

const getViewportSize = () => ({ w: window.innerWidth, h: window.innerHeight })

function getTooltipEdge(position: Position): Edge {
    const { w } = getViewportSize()
    const { x } = clampPosition(position)
    const spaceRight = w - x - HALF_SIZE
    const spaceLeft = x - HALF_SIZE
    // todo no need to compare with TOOLTIP_MAX_WIDTH here
    if (spaceRight >= TOOLTIP_MAX_WIDTH) return 'right'
    if (spaceLeft >= TOOLTIP_MAX_WIDTH) return 'left'
    return spaceRight >= spaceLeft ? 'right' : 'left'
}

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