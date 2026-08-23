import { createNumberUnionGuard, createStringUnionGuard } from 'typescript-guard'

export type PeriodSize = 1 | 2 | 4 | 8
export const isPeriodSize = createNumberUnionGuard<PeriodSize>(1, 2, 4, 8)
export type PeriodRange = {
    curr: tt4b.period.KeyRange
    prev: tt4b.period.KeyRange
}
export type ChartType = 'average' | 'trend' | 'stack'
export const isChartType = createStringUnionGuard<ChartType>('average', 'trend', 'stack')