/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { GRID_WRAPPER_STYLE } from '@app/components/common/grid'
import { KanbanCard } from "@app/components/common/kanban"
import { t } from "@app/locale"
import { periodFormatter } from "@app/util/time"
import { useXsState } from "@hooks"
import Flex from "@pages/components/Flex"
import { defineComponent } from "vue"
import { useAnalysisTimeFormat } from '../../context'
import { initAnalysisTrend } from "./context"
import Dimension from "./Dimension"
import Filter from "./Filter"
import Total from "./Total"

const visitFormatter = (val: number | undefined) => (Number.isInteger(val) ? val?.toString() : val?.toFixed(1)) ?? '-'

const _default = defineComponent(() => {
    const timeFormat = useAnalysisTimeFormat()
    const { visitData, focusData, indicators, previousIndicators } = initAnalysisTrend()
    const isXs = useXsState()

    return () => (
        <KanbanCard title={msg => msg.analysis.trend.title} v-slots={{ filter: () => <Filter /> }}>
            <Flex gap={1} column={isXs.value} style={GRID_WRAPPER_STYLE}>
                <Total
                    activeDay={[indicators.value?.activeDay, previousIndicators.value?.activeDay]}
                    visit={[indicators.value?.visit?.total, previousIndicators.value?.visit?.total]}
                    focus={[indicators.value?.focus?.total, previousIndicators.value?.focus?.total]}
                />
                <Dimension
                    maxLabel={t(msg => msg.analysis.trend.maxFocus)}
                    maxValue={indicators.value?.focus?.max?.value}
                    maxDate={indicators.value?.focus?.max?.date}
                    averageLabel={t(msg => msg.analysis.trend.averageFocus)}
                    average={[indicators.value?.focus?.average, previousIndicators.value?.focus?.average]}
                    valueFormatter={val => periodFormatter(val, { format: timeFormat.value })}
                    data={focusData.value}
                    chartTitle={t(msg => msg.analysis.trend.focusTitle)}
                />
                <Dimension
                    maxLabel={t(msg => msg.analysis.trend.maxVisit)}
                    maxValue={indicators.value?.visit?.max?.value}
                    maxDate={indicators.value?.visit?.max?.date}
                    averageLabel={t(msg => msg.analysis.trend.averageVisit)}
                    average={[indicators.value?.visit?.average, previousIndicators.value?.visit?.average]}
                    valueFormatter={visitFormatter}
                    data={visitData.value}
                    chartTitle={t(msg => msg.analysis.trend.visitTitle)}
                />
            </Flex>
        </KanbanCard>
    )
})

export default _default