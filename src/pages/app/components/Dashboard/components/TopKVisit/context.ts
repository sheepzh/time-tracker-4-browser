import { getSiteStatPage } from "@api/sw/stat"
import { EchartsWrapper, localReactive, useEcharts, useProvide, useProvider, useRemoteValue } from "@hooks"
import { cvtDateRange2Str, MILL_PER_DAY } from "@util/time"
import { createObjectGuard, createStringUnionGuard, isInt } from 'typescript-guard'

export type BizOption = {
    value: number
    // Extensive info
    host: string
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
    const remote = useRemoteValue()
    return useEcharts(Wrapper, async () => {
        const now = new Date()
        const { dayNum, topK: size } = filter
        const startTime: Date = new Date(now.getTime() - MILL_PER_DAY * dayNum)
        const { list: top } = await getSiteStatPage({
            num: 1, size,
            date: cvtDateRange2Str([startTime, now]),
            sortKey: "time",
            sortDirection: 'DESC',
            mergeDate: true,
            remote: remote.value,
        })
        const data = top.map(({ time: value, siteKey: { host } }) => ({ host, value } satisfies BizOption))
        for (let realSize = top.length; realSize < size; realSize++) {
            data.push({ host: '', value: 0 })
        }
        return data
    }, { deps: [() => ({ ...filter }), remote] })
}

export const useTopKFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter
