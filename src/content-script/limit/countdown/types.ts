export type Dimension = 'daily' | 'weekly' | 'visit'

export type RemainingItem = {
    remaining: number
    total: number
    dimension: Dimension
    name: string
}

export type CountdownData = RemainingItem & { all: RemainingItem[] }