/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { StatDay } from '@/shared/day'
import { createTabAfterCurrent } from "@api/chrome/tab"
import { listSiteStats } from '@api/sw/stat'
import ChartTitle from '@app/components/Dashboard/ChartTitle'
import { t } from "@app/locale"
import { RECORD_ROUTE, type RecordQuery } from '@app/router/constants'
import { isCalendarValue } from '@app/util/echarts'
import { useDayOffset, useEcharts, useRemoteValue } from "@hooks"
import { Flex } from '@pages/components'
import { groupBy, sum } from "@util/array"
import { getAppPageUrl } from "@util/constant/url"
import { MILL_PER_HOUR, parseTime } from "@util/time"
import { defineComponent } from "vue"
import Wrapper, { type BizOption } from "./Wrapper"

const titleText = (option: Result | undefined) => {
    const { value, yearAgo } = option || {}
    const start = yearAgo?.toString()
    const totalMills = Object.entries(value ?? {})
        .reduce((sum, [date, v]) => !start || date.localeCompare(start) >= 0 ? sum + v : sum, 0)
    const totalHours = Math.floor(totalMills / MILL_PER_HOUR)
    return t(msg => totalHours
        ? msg.dashboard.heatMap.title0
        : msg.dashboard.heatMap.title1,
        { hour: totalHours }
    )
}

type Result = BizOption & { yearAgo: StatDay }

/**
 * Click to jump to the record page
 *
 * @since 1.1.1
 */
function handleClick(value: unknown): void {
    if (!isCalendarValue(value) || !value[2]) return
    const currentTs = parseTime(value[3])
    const day = StatDay.ofLabel(currentTs).toString()
    const url = getAppPageUrl(RECORD_ROUTE, { ds: day, de: day } satisfies RecordQuery)
    createTabAfterCurrent(url)
}

const _default = defineComponent<{}>(() => {
    const remote = useRemoteValue()
    const { today, weekStart } = useDayOffset()
    const { elRef, data } = useEcharts(Wrapper, async () => {
        const yearAgo = today.value.addDays(-365)
        const dateRange = yearAgo.weekStart(weekStart.value).rangeTo(today.value)
        const items = await listSiteStats({ date: dateRange.toRangeStr(), sortKey: 'date', remote: remote.value })
        const value = groupBy(items, i => i.date, list => sum(list.map(i => i.focus)))
        return { value, dateRange, yearAgo, weekStart: weekStart.value } satisfies Result
    }, {
        afterInit(ew) {
            const supportClick = !window.matchMedia("(any-pointer:coarse)").matches
            supportClick && ew.instance?.on("click", params => handleClick(params.value))
        },
        deps: [remote, today, weekStart],
    })

    return () => (
        <Flex height="100%" gap={4} column>
            <ChartTitle text={titleText(data.value)} remote={remote.value} />
            <div ref={elRef} style={{ flex: 1 }} />
        </Flex>
    )
})

export default _default