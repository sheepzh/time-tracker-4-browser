/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { createTabAfterCurrent } from "@api/chrome/tab"
import type { ReportQueryParam } from "@app/components/Report/types"
import { t } from "@app/locale"
import { REPORT_ROUTE } from "@app/router/constants"
import { useRequest } from "@hooks"
import { useEcharts } from "@hooks/useEcharts"
import Flex from "@pages/components/Flex"
import weekHelper from "@service/components/week-helper"
import { selectSite } from '@service/stat-service'
import { groupBy, sum } from "@util/array"
import { getAppPageUrl } from "@util/constant/url"
import { formatTimeYMD, MILL_PER_DAY, MILL_PER_HOUR } from "@util/time"
import { computed, defineComponent } from "vue"
import ChartTitle from "../../ChartTitle"
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
    const yearAgo = new Date(endTime.getTime() - MILL_PER_DAY * 365)
    const [startTime] = await weekHelper.getWeekDate(yearAgo)
    const items = await selectSite({ date: [startTime, endTime], sortKey: 'date' })
    const value = groupBy(
        items,
        i => i.date,
        list => sum(list?.map(i => i.focus ?? 0))
    )
    return { value, startTime, endTime, yearAgo }
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
    const query: ReportQueryParam = { ds: currentTs, de: currentTs }

    const url = getAppPageUrl(REPORT_ROUTE, query)
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