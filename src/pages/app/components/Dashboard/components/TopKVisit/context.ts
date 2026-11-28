import { getSiteStatPage } from "@api/sw/stat"
import { EchartsWrapper, localReactive, useDayOffset, useEcharts, useProvide, useProvider, useRemoteValue } from "@hooks"
import { createObjectGuard, createStringUnionGuard, isInt, isNumber, isOptionalString, isString } from 'typescript-guard'

export type BizOption = {
    name: string
    value: number
    // Extensive info
    host: string
    alias?: string
}

export const isBizOption = createObjectGuard<BizOption>({
    name: isString,
    value: isNumber,
    host: isString,
    alias: isOptionalString,
})

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
    const { today } = useDayOffset()
    return useEcharts(Wrapper, async () => {
        const { dayNum, topK: size } = filter
        const { list: top } = await getSiteStatPage({
            num: 1, size,
            date: today.value.rangeTo(-dayNum).toRangeStr(),
            sortKey: "time",
            sortDirection: 'DESC',
            mergeDate: true,
            remote: remote.value,
        })
        const data: BizOption[] = top.map(
            ({ time: value, siteKey: { host }, alias }) => ({ name: alias ?? host, host, value, alias })
        )
        for (let realSize = top.length; realSize < size; realSize++) {
            data.push({ name: '', host: '', value: 0 })
        }
        return data
    }, { deps: [() => ({ ...filter }), remote, today] })
}

export const useTopKFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter
