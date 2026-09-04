import { mountStyle } from '@cs/limit/style'
import { t, type I18nKey } from '@cs/locale'
import { formatPeriodCommon, MILL_PER_MINUTE, MILL_PER_SECOND } from '@util/time'
import type { CountdownData, Dimension, RemainingData } from '../types'
import { getEdge, getViewportSize, HALF_SIZE, ICON_SIZE, StatefulNode, type Edge, type Position } from './common'

const TOOLTIP_CLS = 'tooltip'
const CONTAINER_CLS = 'countdown-container'

const STROKE_WIDTH = 3
const RADIUS = (ICON_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const TOOLTIP_MAX_WIDTH = 240
const VIEWPORT_MARGIN = 4

type Stage = 'enough' | 'warning' | 'short'

const STYLE = `
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
    .tooltip-left { left: calc(100% + 8px); right: auto; }
    .tooltip-right { left: auto; right: calc(100% + 8px); }
`

const DIMENSION_LABELS: Record<Dimension, I18nKey> = {
    daily: msg => msg.calendar.range.today,
    weekly: msg => msg.calendar.range.thisWeek,
    visit: msg => msg.limit.thisSession,
}

const STAGE_COLORS: Record<Stage, string> = {
    enough: '#67C23A',
    warning: '#E6A23C',
    short: '#F56C6C',
}

function createSvgEl<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, unknown>): SVGElementTagNameMap[K] {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
    Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, String(v)))
    return el
}

type RingState = { progress: number, stage: Stage }

class ProgressRing extends StatefulNode<RingState, SVGSVGElement> {
    // `declare` prevents TS from emitting a class field initializer that would overwrite the value assigned in `init()`
    declare private circle?: SVGCircleElement

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

    protected shouldRender({ progress, stage }: RingState, last: RingState | null): boolean {
        return progress !== last?.progress || stage !== last.stage
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

class CenterText extends StatefulNode<string, HTMLSpanElement> {
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

class Tooltip extends StatefulNode<RemainingData[], HTMLDivElement> {
    #visible = false
    #edge: Edge = 'right'
    #y = 0
    #data: RemainingData[] = []

    constructor(hoverTarget: HTMLElement) {
        super()
        hoverTarget.addEventListener('mouseenter', () => {
            this.#visible = true
            this.render(this.#data)
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
        if (y === this.#y) return
        this.#y = y
        this.#reposition()
    }

    #reposition() {
        const y = this.#y
        const { height } = this.el.getBoundingClientRect()
        const { h } = getViewportSize()
        const centeredTop = y - height / 2
        const clampedTop = Math.max(VIEWPORT_MARGIN, Math.min(h - VIEWPORT_MARGIN - height, centeredTop))
        mountStyle(this.el, { top: `${clampedTop - (y - HALF_SIZE)}px` })
    }

    protected init(): HTMLDivElement {
        const el = document.createElement('div')
        el.classList.add(TOOLTIP_CLS, 'tooltip-right')
        return el
    }

    render(state: RemainingData[]) {
        // Cached
        this.#data = state
        super.render(state)
    }

    protected shouldRender(): boolean {
        return this.#visible
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
                dimensionCell.innerText = t(DIMENSION_LABELS[item.dimension])
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
        this.#reposition()
    }
}

class Container extends StatefulNode<boolean, HTMLElement> {
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

    protected doRender(pulsing: boolean): void {
        this.el.classList.toggle('pulse', pulsing)
    }
}

export class Icon {
    el: HTMLElement
    #container: Container
    #tooltip: Tooltip
    #text: CenterText
    #ring: ProgressRing

    constructor() {
        this.el = document.createElement('div')
        mountStyle(this.el, {
            position: 'fixed',
            zIndex: Number.MAX_SAFE_INTEGER.toString(),
            width: `${ICON_SIZE}px`,
            height: `${ICON_SIZE}px`,
        })

        const shadow = this.el.attachShadow({ mode: 'open' })
        const style = document.createElement('style')
        style.textContent = STYLE
        shadow.append(style)

        this.#container = new Container()
        const containerEl = this.#container.el
        shadow.append(containerEl)

        this.#ring = new ProgressRing()
        containerEl.append(this.#ring.el)

        this.#text = new CenterText()
        containerEl.append(this.#text.el)

        this.#tooltip = new Tooltip(containerEl)
        containerEl.append(this.#tooltip.el)
    }

    set position({ x, y }: Position) {
        this.#tooltip.edge = getEdge(x)
        this.#tooltip.y = y
    }

    render({ target: { remaining, total }, all }: CountdownData) {
        this.#text.render(this.#formatRemaining(remaining))
        const stage = this.#calcStage(remaining, total)
        this.#ring.render({ stage, progress: Math.ceil(remaining / total * 100) })
        this.#container.render(stage === 'short')
        this.#tooltip.render(all)
    }

    #formatRemaining(remaining: number): string {
        const seconds = Math.ceil(remaining / MILL_PER_SECOND)
        if (seconds <= 0) return '0s'
        const hours = Math.floor(seconds / 3600)
        if (hours > 0) return `${hours}h`
        const minutes = Math.floor(seconds / 60)
        if (minutes > 0) return `${minutes}m`
        return `${seconds}s`
    }

    #calcStage(remaining: number, total: number): Stage {
        const progress = remaining / total
        if (progress < 0.2 || remaining < 30 * MILL_PER_SECOND) return 'short'
        if (progress < 0.5 || remaining < 2 * MILL_PER_MINUTE) return 'warning'
        return 'enough'
    }

    destroy() {
        this.el.remove()
    }
}
