import { getSiteStatPage } from "@api/sw/stat"
import { localReactive, useProvide, useProvider, useRequest } from "@hooks"
import { cvtDateRange2Str, MILL_PER_DAY } from "@util/time"
import { createObjectGuard, createStringUnionGuard, isInt } from 'typescript-guard'
import { type ShallowRef } from "vue"

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
const isTopKFilterOption = createObjectGuard<TopKFilterOption>({
    topK: isInt,
    dayNum: isInt,
    topKChartType: isTopKChartType,
})

type Context = {
    value: ShallowRef<BizOption[]>
    filter: TopKFilterOption
}

const NAMESPACE = 'dashboardTopKVisit'

export const initProvider = () => {
    const filter = localReactive<TopKFilterOption>(
        `${NAMESPACE}_filter`, isTopKFilterOption, { topK: 6, dayNum: 30, topKChartType: 'pie' }
    )
    const { data: value } = useRequest(async () => {
        const now = new Date()
        const startTime: Date = new Date(now.getTime() - MILL_PER_DAY * filter.dayNum)
        const query: tt4b.stat.SiteQuery = {
            date: cvtDateRange2Str([startTime, now]),
            sortKey: "time",
            sortDirection: 'DESC',
            mergeDate: true,
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
    }, {
        deps: [() => filter.topK, () => filter.topKChartType, () => filter.dayNum],
        defaultValue: []
    })

    useProvide<Context>(NAMESPACE, { value, filter })

    return filter
}

export const useTopKValue = () => useProvider<Context, 'value'>(NAMESPACE, "value").value

export const useTopKFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter
