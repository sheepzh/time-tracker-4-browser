import { StatDay, type StatRange } from '@/shared/day'
import { listAllGroups } from '@api/chrome/tabGroups'
import { useDayOffset, useRequest } from "@hooks"
import { useCateNameMap } from '@popup/context'
import { HEADER_OPTION_SLOT, TOOLBAR_SLOT } from '@popup/slot'
import { ElCard } from "element-plus"
import { computed, defineComponent, Teleport } from "vue"
import { queryRows } from '../stat/common'
import { initStatContext } from '../stat/context'
import StatToolbar from '../stat/StatToolbar'
import Cate from "./Cate"
import PercentageOption from './Option'
import Site from "./Site"
import type { PercentageResult } from './types'

const findAllDates = (row: tt4b.stat.Row): string[] => {
    const set = new Set<string>()
    const { date, mergedDates } = row
    date && set.add(date)
    mergedDates?.forEach(d => set.add(d))
    'mergedRows' in row && row.mergedRows?.flatMap(findAllDates).forEach(d => set.add(d))
    return Array.from(set)
}

const findDateRange = (dates: Set<string>): StatRange | undefined => {
    let minDate: string | undefined = undefined
    let maxDate: string | undefined = undefined
    for (const d of dates) {
        if (!minDate || d < minDate) minDate = d
        if (!maxDate || d > maxDate) maxDate = d
    }
    const end = StatDay.parse(maxDate)
    return end && StatDay.parse(minDate)?.rangeTo(end)
}

const Percentage = defineComponent(() => {
    const { query, option } = initStatContext()
    const cateNameMap = useCateNameMap()
    const { today, weekStart } = useDayOffset()

    const { data: rowData } = useRequest(
        () => queryRows({ ...query, today: today.value, weekStart: weekStart.value }),
        { deps: [today, weekStart, () => ({ ...query })] },
    )
    const { data: groups } = useRequest(listAllGroups)
    const data = computed(() => {
        const [rows = [], date] = rowData.value ?? []
        const allDates = new Set<string>()
        rows.flatMap(findAllDates).forEach(d => allDates.add(d))
        return {
            query: { ...query }, option: { ...option }, rows, date,
            groups: groups.value ?? [],
            cateNameMap: cateNameMap.value,
            dataDate: findDateRange(allDates),
            dateLength: allDates.size || date?.days() || 1,
        } satisfies PercentageResult
    })

    return () => <>
        <Teleport defer to={`#${TOOLBAR_SLOT}`}>
            <StatToolbar />
        </Teleport>
        <Teleport defer to={`#${HEADER_OPTION_SLOT}`}>
            <PercentageOption />
        </Teleport>
        <ElCard
            shadow="never"
            style={{ width: '100%', height: '100%' }}
            bodyStyle={{ height: '100%', boxSizing: 'border-box', padding: 0, overflow: 'hidden' }}
        >
            {query.mergeMethod === 'cate' ? <Cate value={data.value} /> : <Site value={data.value} />}
        </ElCard>
    </>
})

export default Percentage