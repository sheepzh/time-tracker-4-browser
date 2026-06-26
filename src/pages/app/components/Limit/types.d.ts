export type LimitFilterOption = {
    url: string | undefined
    effective: boolean
}

export type ModifyInstance = {
    create(url?: string): void
    modify(row: tt4b.limit.Item): void
}

export type TestInstance = {
    show(): void
}

export type ModifyForm = MakeOptionalUndefined<Omit<tt4b.limit.Rule, 'id'>> & {
    urlMiss?: boolean
}