export type Dimension = 'daily' | 'weekly' | 'visit'

export type RemainingItem = {
    remaining: number
    total: number
    dimension: Dimension
}

export type RemainingData = {
    ruleId: number
    ruleName: string
    items: RemainingItem[]
}

export type CountdownData = {
    target: Pick<RemainingData, 'ruleId' | 'ruleName'> & RemainingItem
    all: RemainingData[]
}