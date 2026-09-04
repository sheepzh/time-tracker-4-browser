import { mountStyle } from '@cs/limit/style'
import type { CountdownData } from '../types'
import { getEdge, getViewportSize, HALF_SIZE, type Position } from './common'
import { Icon } from './icon'

function defaultPosition(): Position {
    const { w, h } = getViewportSize()
    return { x: w - HALF_SIZE, y: h - HALF_SIZE }
}

function clampPosition({ x, y }: Position): Position {
    const { w, h } = getViewportSize()
    return {
        x: Math.max(HALF_SIZE, Math.min(w - HALF_SIZE, x)),
        y: Math.max(HALF_SIZE, Math.min(h - HALF_SIZE, y)),
    }
}

function snapPosition(position: Position): Position {
    const { w } = getViewportSize()
    const { x, y } = clampPosition(position)
    return { x: getEdge(x) === 'left' ? HALF_SIZE : w - HALF_SIZE, y }
}

const applyPosition = (el: HTMLElement, { x, y }: Position) => mountStyle(el, {
    left: `${x - HALF_SIZE}px`,
    top: `${y - HALF_SIZE}px`,
    right: 'auto',
    bottom: 'auto',
})

const DRAG_THRESHOLD = 5

function appendToBody(el: HTMLElement) {
    if (document.body) {
        document.body.append(el)
        return
    }
    document.addEventListener('DOMContentLoaded', () => document.body?.append(el), { once: true })
}

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
        el.hasPointerCapture(ev.pointerId) && el.releasePointerCapture(ev.pointerId)
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
        const next = snapPosition(curr)
        if (next.x === curr.x && next.y === curr.y) return
        curr = next
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
    #icon?: Icon
    #dragCleanup?: NoArgCallback
    #position: Position = defaultPosition()

    render(data: CountdownData | undefined) {
        data ? this.#show(data) : this.#destroy()
    }

    #show(data: CountdownData) {
        if (!this.#icon) {
            const icon = new Icon()
            this.#icon = icon
            icon.position = this.#position
            this.#dragCleanup = initDrag(
                icon.el,
                this.#position,
                pos => this.#position = icon.position = pos,
            )
            appendToBody(icon.el)
        }
        this.#icon.render(data)
    }

    #destroy() {
        this.#dragCleanup?.()
        this.#dragCleanup = undefined
        this.#icon?.destroy()
        this.#icon = undefined
    }
}