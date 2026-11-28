import type { StatDay, StatRange } from '@/shared/day'
import { listSiteStats } from "@api/sw/stat"
import ChartTitle from "@app/components/Dashboard/ChartTitle"
import { t } from "@app/locale"
import { useDayOffset, useEcharts, useRemoteValue } from "@hooks"
import { Flex } from '@pages/components'
import { groupBy, sum } from "@util/array"
import DateIterator from "@util/date-iterator"
import { defineComponent } from "vue"
import Wrapper from "./Wrapper"

const PERIOD_WIDTH = 30
const TOP_NUM = 15

type Row = {
    date: string
    total: number
}

const cvtRow = (rows: tt4b.stat.Row[], range: StatRange): Row[] => {
    const groupByDate = groupBy(rows, r => r.date, l => sum(l.map(e => e.focus)))
    return [...DateIterator.of(range)].map(date => ({ total: groupByDate[date] ?? 0, date }))
}

const fetchData = async (remote: boolean, today: StatDay): Promise<[thisMonth: Row[], lastMonth: Row[]]> => {
    const lastRange = today.addDays(1 - PERIOD_WIDTH * 2).rangeTo(PERIOD_WIDTH - 1)
    const thisRange = today.addDays(1 - PERIOD_WIDTH).rangeTo(PERIOD_WIDTH - 1)

    const lastPeriodItems = await listSiteStats({ date: lastRange.toRangeStr(), remote })
    const lastRows = cvtRow(lastPeriodItems, lastRange)
    const thisPeriodItems = await listSiteStats({ date: thisRange.toRangeStr(), remote })
    const thisRows = cvtRow(thisPeriodItems, thisRange)
    return [lastRows, thisRows]
}

const _default = defineComponent<{}>(() => {
    const remote = useRemoteValue()
    const { today } = useDayOffset()
    const { elRef } = useEcharts(Wrapper, () => fetchData(remote.value, today.value), { deps: [remote, today] })
    return () => (
        <Flex height="100%" column gap={4}>
            <ChartTitle
                remote={remote.value}
                text={t(msg => msg.dashboard.monthOnMonth.title, { k: TOP_NUM })}
            />
            <div ref={elRef} style={{ flex: 1 }} />
        </Flex>
    )
})

export default _default