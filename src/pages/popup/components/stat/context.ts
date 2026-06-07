import { useLocalStorage, useProvide, useProvider } from "@hooks"
import {
    createObjectGuard, createOptionalGuard, createStringUnionGuard, isBoolean, isInt, isOptionalInt,
} from 'typescript-guard'
import { reactive, toRaw, watch } from "vue"
import type { StatOption, StatQuery } from './types'

type StatContextValue = {
    query: StatQuery
    option: StatOption
}

const NAMESPACE = 'stat'

const isStatQuery = createObjectGuard<StatQuery>({
    dimension: createStringUnionGuard<StatQuery['dimension']>('focus', 'time'),
    duration: createStringUnionGuard<StatQuery['duration']>('allTime', 'lastDays', 'thisMonth', 'thisWeek', 'today', 'yesterday'),
    durationNum: isOptionalInt,
    mergeMethod: createOptionalGuard(createStringUnionGuard<Exclude<tt4b.stat.MergeMethod, 'date'>>('cate', 'domain', 'group')),
})

const isStatOption = createObjectGuard<StatOption>({
    showName: isBoolean,
    topN: isInt,
    donutChart: isBoolean,
})

export const initStatContext = () => {
    const [queryCache, setQueryCache] = useLocalStorage<StatQuery>('popup-query', isStatQuery, {
        dimension: 'focus',
        duration: 'today',
        mergeMethod: undefined,
    })

    const query = reactive(queryCache)
    watch(query, () => setQueryCache(toRaw(query)), { deep: true })

    const [optionCache, setOptionCache] = useLocalStorage<StatOption>('popup-option', isStatOption, {
        showName: true,
        topN: 10,
        donutChart: false,
    })

    const option = reactive(optionCache)
    watch(option, () => setOptionCache(toRaw(option)), { deep: true })

    useProvide<StatContextValue>(NAMESPACE, { query, option })
}

export const useStatQuery = () => useProvider<StatContextValue, 'query'>(NAMESPACE, 'query').query

export const useStatOption = () => useProvider<StatContextValue, 'option'>(NAMESPACE, 'option').option
