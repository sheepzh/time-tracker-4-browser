export type Dimension = 'daily' | 'weekly' | 'visit'

export type RemainingItem = {
    remaining: number
    total: number
    dimension: Dimension
}

export type RemainingData = {
    ruleName: string
    items: RemainingItem[]
}

export type CountdownData = {
    target: RemainingItem
    all: RemainingData[]
}