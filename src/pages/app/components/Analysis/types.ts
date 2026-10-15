import { createObjectGuard, createStringUnionGuard, isNumber, isOptionalString, isString } from 'typescript-guard'

export type AnalysisTarget = {
    type: 'site'
    key: tt4b.site.SiteInfo
} | {
    type: 'cate'
    key: number
}

export type Circle = 'daily' | 'weekly'
export const isCircle = createStringUnionGuard<Circle>('daily', 'weekly')

export type DimensionEntry = {
    date: string
    endDate?: string
    value: number
}

export const isDimensionEntry = createObjectGuard<DimensionEntry>({
    date: isString,
    endDate: isOptionalString,
    value: isNumber,
})

export type DimensionData = {
    curr: DimensionEntry[]
    prev: DimensionEntry[]
}
