import { selectSitePage } from "@api/sw/stat"
import { useLocalStorage, useProvide, useProvider, useRequest } from "@hooks"
import { MILL_PER_DAY, cvtDateRange2Str } from "@util/time"
import { reactive, toRaw, watch, type Reactive, type Ref } from "vue"

export type BizOption = {
    name: string
    value: number
    // Extensive info
    host: string
    alias?: string
}

export type TopKChartType = 'bar' | 'pie' | 'halfPie'

export type TopKFilterOption = {
    topK: number
    dayNum: number
    topKChartType: TopKChartType
}

type Context = {
    value: Ref<BizOption[]>
    filter: Reactive<TopKFilterOption>
}

const NAMESPACE = 'dashboardTopKVisit'

export const initProvider = () => {
    const [cachedFilter, setFilterCache] = useLocalStorage<TopKFilterOption>(
        'habit_period_filter', { topK: 6, dayNum: 30, topKChartType: 'pie' }
    )
    const filter = reactive<TopKFilterOption>(cachedFilter)
    watch(() => filter, () => setFilterCache(toRaw(filter)), { deep: true })
    const { data: value } = useRequest(async () => {
        const now = new Date()
        const startTime: Date = new Date(now.getTime() - MILL_PER_DAY * filter.dayNum)
        const query: timer.stat.SiteQuery = {
            date: cvtDateRange2Str([startTime, now]),
            sortKey: "time",
            sortDirection: 'DESC',
            mergeDate: true,
        }
        const SIZE = filter.topK
        const pageResult = await selectSitePage({ num: 1, size: SIZE, ...query })
        const top = pageResult?.list ?? []
        const data: BizOption[] = top.map(({ time, siteKey, alias }) => ({
            name: alias ?? siteKey?.host ?? '',
            host: siteKey?.host ?? '',
            alias,
            value: time,
        }))
        for (let realSize = top.length; realSize < SIZE; realSize++) {
            data.push({ name: '', host: '', value: 0 })
        }
        return data
    }, {
        deps: [() => filter.topK, () => filter.topKChartType, () => filter.dayNum],
        defaultValue: []
    })

    useProvide<Context>(NAMESPACE, { value, filter })

    return filter
}

export const useTopKValue = () => useProvider<Context, 'value'>(NAMESPACE, "value").value

export const useTopKFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter
