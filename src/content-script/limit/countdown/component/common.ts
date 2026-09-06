export const ICON_SIZE = 40
export const HALF_SIZE = ICON_SIZE / 2

export type Position = { x: number, y: number }
export type Edge = 'left' | 'right'

export abstract class StatefulNode<State, E extends Element> {
    el: E
    protected state: State | null = null

    constructor() {
        this.el = this.init()
    }

    protected abstract init(): E

    render(state: State) {
        if (!this.shouldRender(state, this.state)) return
        this.doRender(state, this.state)
        this.state = state
    }

    protected shouldRender(state: State, last: State | null): boolean {
        return state !== last
    }

    protected abstract doRender(state: State, last: State | null): void
}

export const getViewportSize = () => ({ w: window.innerWidth, h: window.innerHeight })

export const getEdge = (x: number): Edge => x < getViewportSize().w - x ? 'left' : 'right'