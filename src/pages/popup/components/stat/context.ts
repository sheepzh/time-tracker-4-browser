import { localReactive, useProvide, useProvider } from '@hooks'
import {
    createLiteralGuard, createObjectGuard, createOptionalGuard, createStringUnionGuard, createUnionGuard,
    isBoolean, isInt,
} from 'typescript-guard'


export const isDuration = createStringUnionGuard<tt4b.ui.PopupDuration>(
    "allTime", "today", "yesterday", "thisWeek", "thisMonth", "lastDays",
)

export type DurationValue = {
    type: tt4b.ui.PopupDuration & 'lastDays'
    value: number
} | Exclude<tt4b.ui.PopupDuration, 'lastDays'>

const isDurationValue = createUnionGuard(
    createStringUnionGuard<Exclude<tt4b.ui.PopupDuration, 'lastDays'>>(
        "allTime", "today", "yesterday", "thisWeek", "thisMonth",
    ),
    createObjectGuard<{
        type: tt4b.ui.PopupDuration & 'lastDays'
        value: number
    }>({
        type: createLiteralGuard("lastDays"),
        value: isInt,
    })
)

export type StatQuery = {
    mergeMethod: Exclude<tt4b.stat.MergeMethod, 'date'> | undefined
    duration: DurationValue
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
    duration: isDurationValue,
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
