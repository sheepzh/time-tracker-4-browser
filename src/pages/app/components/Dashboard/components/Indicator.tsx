/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listPeriods } from "@api/sw/period"
import { listSiteStats } from "@api/sw/stat"
import { tN, type I18nKey } from "@app/locale"
import { Sunrise } from "@element-plus/icons-vue"
import { useRequest, useXsState } from "@hooks"
import { Flex } from '@pages/components'
import { groupBy, sum } from '@util/array'
import { getDayLength, getStartOfDay, MILL_PER_HOUR, parseTime } from "@util/time"
import { ElIcon, ElScrollbar } from "element-plus"
import { computed, defineComponent, type FunctionalComponent, type VNode } from "vue"
import NumberGrow from "./NumberGrow"

type _Value = {
    installedDays: number
    sites: number
    visits: number
    browsingTime: number
    busiestClock: number | undefined
}

function calcBusiestClock(rows: tt4b.period.Row[]): number | undefined {
    const map = groupBy(rows,
        ({ startTime }) => startTime - getStartOfDay(startTime),
        list => sum(list.map(e => e.milliseconds))
    )
    const maxOffsetStr = Object.entries(map).toSorted((a, b) => b[1] - a[1])[0]?.[0]
    if (maxOffsetStr === undefined) return undefined
    return Math.floor(Number.parseInt(maxOffsetStr) / MILL_PER_HOUR)
}

async function query(): Promise<_Value> {
    const allData = await listSiteStats()
    const hostSet = new Set<string>()
    let visits = 0
    let browsingTime = 0
    allData.forEach(({ siteKey: { host }, focus, time }) => {
        hostSet.add(host)
        visits += time
        browsingTime += focus
    })
    const periods = await listPeriods({ size: 8 })
    const firstDate = allData.map(a => a.date).toSorted((a, b) => a.localeCompare(b))[0]

    return {
        sites: hostSet.size,
        visits,
        browsingTime,
        busiestClock: calcBusiestClock(periods),
        installedDays: firstDate ? getDayLength(parseTime(firstDate), new Date()) : 0
    }
}

const computeI18nParam = (valueParam: Record<string, number>, duration?: number): Record<string, VNode> => {
    return Object.fromEntries(
        Object.entries(valueParam).map(([key, val]) => [key, <NumberGrow value={val} duration={duration} />])
    )
}
type Props = {
    path: I18nKey
    param: Record<string, number>
    duration?: number
}

const IndicatorLabel: FunctionalComponent<Props> = ({ path, duration, param }) => (
    <div style={{ paddingInlineStart: '10px', paddingBottom: '10px', fontSize: '15px' }}>
        {tN(path, computeI18nParam(param, duration))}
    </div>
)

const computeMost2HourParam = (value: _Value | undefined): { start: number, end: number } => {
    const { busiestClock } = value ?? {}
    const [start, end] = busiestClock === undefined || isNaN(busiestClock)
        ? [0, 0]
        : [busiestClock, busiestClock + 2]
    return { start, end }
}

const _default = defineComponent(() => {
    const { data } = useRequest(query)
    const isXs = useXsState()
    const most2HourParam = computed(() => computeMost2HourParam(data.value))

    return () => (
        <ElScrollbar>
            <Flex column gap={4} style={{ textAlign: isXs.value ? 'center' : undefined }} height='100%'>
                <Flex align="center" justify="center" marginBlock="0 15px">
                    <ElIcon size={45}>
                        <Sunrise />
                    </ElIcon>
                </Flex>
                <IndicatorLabel
                    v-show={data.value?.installedDays}
                    path={msg => msg.dashboard.indicator.installedDays}
                    param={{ number: data.value?.installedDays || 0 }}
                    duration={1.5}
                />
                <IndicatorLabel
                    path={msg => msg.dashboard.indicator.visitCount}
                    param={{ visit: data.value?.visits || 0, site: data.value?.sites || 0 }}
                    duration={1.75}
                />
                <IndicatorLabel
                    path={msg => msg.dashboard.indicator.browsingTime}
                    param={{ hour: (data.value?.browsingTime ?? 0) / MILL_PER_HOUR }}
                    duration={2}
                />
                <IndicatorLabel
                    path={msg => msg.dashboard.indicator.mostUse}
                    param={most2HourParam.value}
                    duration={2.25}
                />
            </Flex>
        </ElScrollbar>
    )
})

export default _default
