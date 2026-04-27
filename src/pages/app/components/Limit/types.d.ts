export type LimitFilterOption = {
    url: string | undefined
    effective: boolean
}

export type ModifyInstance = {
    create(url?: string): void
    modify(row: timer.limit.Item): void
}

export type TestInstance = {
    show(): void
}

export type LimitInstance = {
    getSelected(): timer.limit.Item[]
}

export type ModifyForm = Omit<timer.limit.Rule, 'id'> & {
    urlMiss?: boolean
}