import { localReactive, useProvide, useProvider } from '@hooks'
import {
    createObjectGuard, createOptionalGuard, createStringUnionGuard, isBoolean, isInt, isOptionalInt,
} from 'typescript-guard'

export type StatDuration =
    | "today" | "yesterday" | "thisWeek" | "thisMonth"
    | "lastDays"
    | "allTime"

export type StatQuery = {
    mergeMethod: Exclude<tt4b.stat.MergeMethod, 'date'> | undefined
    duration: StatDuration
    durationNum?: number
    dimension: Exclude<tt4b.core.Dimension, 'run'>
}

export type StatOption = {
    showName: boolean
    topN: number
    donutChart: boolean
}

type ContextValue = {
    query: StatQuery
    option: StatOption
}

const NAMESPACE = 'stat'

const isMergeMethod = createStringUnionGuard<Exclude<StatQuery['mergeMethod'], undefined>>('cate', 'domain', 'group')

const isStatQuery = createObjectGuard<StatQuery>({
    dimension: createStringUnionGuard<StatQuery['dimension']>('focus', 'time'),
    duration: createStringUnionGuard<StatQuery['duration']>('allTime', 'lastDays', 'thisMonth', 'thisWeek', 'today', 'yesterday'),
    durationNum: isOptionalInt,
    mergeMethod: createOptionalGuard(isMergeMethod),
})

const isStatOption = createObjectGuard<StatOption>({
    showName: isBoolean,
    topN: isInt,
    donutChart: isBoolean,
})

export const initStatContext = () => {
    const query = localReactive(`popup-${NAMESPACE}-query`, isStatQuery, {
        dimension: 'focus',
        duration: 'today',
        mergeMethod: undefined,
    })

    const option = localReactive(`popup-${NAMESPACE}-option`, isStatOption, {
        showName: true,
        topN: 10,
        donutChart: false,
    })

    useProvide<ContextValue>(NAMESPACE, { query, option })

    return { query, option }
}

export const useStatQuery = () => useProvider<ContextValue, 'query'>(NAMESPACE, 'query').query

export const useStatOption = () => useProvider<ContextValue, 'option'>(NAMESPACE, 'option').option
