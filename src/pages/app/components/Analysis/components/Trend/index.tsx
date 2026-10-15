/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { useAnalysisTimeFormat } from '@app/components/Analysis/context'
import { GRID_WRAPPER_STYLE } from '@app/components/common/grid'
import { KanbanCard } from '@app/components/common/kanban'
import type { RingValue } from '@app/components/common/kanban/types'
import { t } from "@app/locale"
import { periodFormatter } from '@app/util/time'
import { useXsState } from "@hooks"
import { Flex } from '@pages/components'
import { defineComponent } from "vue"
import { initAnalysisTrend } from "./context"
import Dimension from "./Dimension"
import Filter from "./Filter"
import Total from "./Total"

const visitFormatter = (val?: number) => (Number.isInteger(val) ? val?.toString() : val?.toFixed(1)) ?? '-'

const ringOf = (curr?: number, prev?: number): RingValue | undefined =>
    curr === undefined || prev === undefined ? undefined : [curr, prev]

const _default = defineComponent(() => {
    const timeFormat = useAnalysisTimeFormat()
    const { curr, prev } = initAnalysisTrend()
    const isXs = useXsState()

    return () => (
        <KanbanCard title={msg => msg.analysis.trend.title} v-slots={{ filter: () => <Filter /> }}>
            <Flex gap={1} column={isXs.value} style={GRID_WRAPPER_STYLE}>
                <Total
                    activeDay={ringOf(curr.value?.indicators.activeDay, prev.value?.indicators.activeDay)}
                    visit={ringOf(curr.value?.indicators.visit.total, prev.value?.indicators.visit.total)}
                    focus={ringOf(curr.value?.indicators.focus.total, prev.value?.indicators.focus.total)}
                />
                <Dimension
                    maxLabel={t(msg => msg.analysis.trend.focusMax)}
                    max={curr.value?.indicators.focus.max}
                    averageLabel={t(msg => msg.analysis.trend.focusAverage)}
                    average={ringOf(curr.value?.indicators.focus.average, prev.value?.indicators.focus.average)}
                    valueFormatter={val => periodFormatter(val, { format: timeFormat.value })}
                    data={{ curr: curr.value?.focus ?? [], prev: prev.value?.focus ?? [] }}
                    chartTitle={t(msg => msg.analysis.trend.focusTitle)}
                />
                <Dimension
                    maxLabel={t(msg => msg.analysis.trend.visitMax)}
                    max={curr.value?.indicators.visit.max}
                    averageLabel={t(msg => msg.analysis.trend.visitAverage)}
                    average={ringOf(curr.value?.indicators.visit.average, prev.value?.indicators.visit.average)}
                    valueFormatter={visitFormatter}
                    data={{ curr: curr.value?.visit ?? [], prev: prev.value?.visit ?? [] }}
                    chartTitle={t(msg => msg.analysis.trend.visitTitle)}
                />
            </Flex>
        </KanbanCard>
    )
})

export default _default