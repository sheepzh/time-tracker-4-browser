import { getSiteStatPage } from "@api/sw/stat"
import { EchartsWrapper, localReactive, useEcharts, useProvide, useProvider, useRemote } from "@hooks"
import { cvtDateRange2Str, MILL_PER_DAY } from "@util/time"
import { createObjectGuard, createStringUnionGuard, isInt } from 'typescript-guard'

export type BizOption = {
    name: string
    value: number
    // Extensive info
    host: string
    alias?: string
}

export type TopKChartType = 'bar' | 'pie' | 'halfPie'
const isTopKChartType = createStringUnionGuard<TopKChartType>('bar', 'pie', 'halfPie')

export type TopKFilterOption = {
    topK: number
    dayNum: number
    topKChartType: TopKChartType
}
const isFilter = createObjectGuard<TopKFilterOption>({
    topK: isInt,
    dayNum: isInt,
    topKChartType: isTopKChartType,
})

type Context = { filter: TopKFilterOption }

const NAMESPACE = 'dashboardTopKVisit'

export const initProvider = () => {
    const filter = localReactive<TopKFilterOption>(
        `${NAMESPACE}_filter`, isFilter, { topK: 6, dayNum: 30, topKChartType: 'pie' }
    )
    useProvide<Context>(NAMESPACE, { filter })
    return filter
}

export const useTopKChart = <EC>(Wrapper: new () => EchartsWrapper<BizOption[], EC>) => {
    const filter = useTopKFilter()
    const remote = useRemote()
    return useEcharts(Wrapper, async () => {
        const now = new Date()
        const startTime: Date = new Date(now.getTime() - MILL_PER_DAY * filter.dayNum)
        const query: tt4b.stat.SiteQuery = {
            date: cvtDateRange2Str([startTime, now]),
            sortKey: "time",
            sortDirection: 'DESC',
            mergeDate: true,
            remote: remote.value,
        }
        const SIZE = filter.topK
        const { list: top } = await getSiteStatPage({ num: 1, size: SIZE, ...query })
        const data: BizOption[] = top.map(({ time, siteKey: { host }, alias }) => ({
            name: alias ?? host,
            host, alias,
            value: time,
        }))
        for (let realSize = top.length; realSize < SIZE; realSize++) {
            data.push({ name: '', host: '', value: 0 })
        }
        return data
    }, { deps: [() => ({ ...filter }), remote] })
}

export const useTopKFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter
