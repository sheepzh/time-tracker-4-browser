/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getWeekStartTime } from '@/api/sw/option'
import { createTabAfterCurrent } from "@api/chrome/tab"
import { listSiteStats } from '@api/sw/stat'
import ChartTitle from '@app/components/Dashboard/ChartTitle'
import { t } from "@app/locale"
import { REPORT_ROUTE, type ReportQuery } from '@app/router/constants'
import { useEcharts, useRequest } from "@hooks"
import Flex from "@pages/components/Flex"
import { groupBy, sum } from "@util/array"
import { getAppPageUrl } from "@util/constant/url"
import { cvtDateRange2Str, formatTimeYMD, MILL_PER_DAY, MILL_PER_HOUR } from "@util/time"
import { computed, defineComponent } from "vue"
import Wrapper, { type BizOption, type ChartValue } from "./Wrapper"

const titleText = (option: Result | undefined) => {
    const { value, yearAgo } = option || {}
    const start = yearAgo ? formatTimeYMD(yearAgo) : '-'
    const statValues = Object.entries(value || {}).filter(([date]) => date.localeCompare(start) >= 0).map(([, v]) => v)
    const totalMills = sum(statValues)
    const totalHours = Math.floor(totalMills / MILL_PER_HOUR)
    return t(msg => totalHours
        ? msg.dashboard.heatMap.title0
        : msg.dashboard.heatMap.title1,
        { hour: totalHours }
    )
}

type Result = BizOption & { yearAgo: Date }

const fetchData = async (): Promise<Result> => {
    const endTime = new Date()
    const yearAgo = endTime.getTime() - MILL_PER_DAY * 365
    const startTime = await getWeekStartTime(yearAgo)
    const items = await listSiteStats({ date: cvtDateRange2Str([startTime, endTime]), sortKey: 'date' })
    const value = groupBy(items, i => i.date, list => sum(list.map(i => i.focus)))
    return { value, startTime, endTime, yearAgo: new Date(yearAgo) }
}

/**
 * Click to jump to the report page
 *
 * @since 1.1.1
 */
function handleClick(value: ChartValue): void {
    const [_1, _2, minutes, currentDate] = value
    if (!minutes) {
        return
    }

    const currentYear = parseInt(currentDate.substring(0, 4))
    const currentMonth = parseInt(currentDate.substring(4, 6)) - 1
    const currentDay = parseInt(currentDate.substring(6, 8))
    const currentTs = (new Date(currentYear, currentMonth, currentDay).getTime() + 1000).toString()

    const url = getAppPageUrl(REPORT_ROUTE, { ds: currentTs, de: currentTs } satisfies ReportQuery)
    createTabAfterCurrent(url)
}

const _default = defineComponent(() => {
    const { data } = useRequest(fetchData)
    const biz = computed(() => (data.value as BizOption))
    const { elRef } = useEcharts(Wrapper, biz, {
        afterInit(ew) {
            const supportClick = !window.matchMedia("(any-pointer:coarse)").matches
            supportClick && ew.instance?.on("click", (params: any) => handleClick(params.value as ChartValue))
        }
    })

    return () => (
        <Flex height="100%" gap={4} column>
            <ChartTitle text={titleText(data.value)} />
            <div ref={elRef} style={{ flex: 1 }} />
        </Flex>
    )
})

export default _default