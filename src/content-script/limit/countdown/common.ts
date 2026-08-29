export const ICON_SIZE = 40
export const HALF_SIZE = ICON_SIZE / 2
export const TIMER_INTERVAL = 1000

export type Position = { x: number, y: number }

export type Dimension = 'daily' | 'weekly' | 'visit'

export type RemainingItem = {
    remaining: number
    total: number
    dimension: Dimension
    name: string
}

export type CountdownData = RemainingItem & { all: RemainingItem[] }