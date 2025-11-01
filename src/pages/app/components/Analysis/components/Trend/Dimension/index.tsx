/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { formatValue, type DimensionEntry, type RingValue, type ValueFormatter } from "@app/components/Analysis/util"
import { GRID_CELL_STYLE } from '@app/components/common/grid'
import { KanbanIndicatorCell } from "@app/components/common/kanban"
import { cvt2LocaleTime } from "@app/util/time"
import { useXsState } from "@hooks"
import Box from "@pages/components/Box"
import Flex from "@pages/components/Flex"
import { defineComponent } from "vue"
import Chart from "./Chart"

export type DimensionData = {
    thisPeriod: DimensionEntry[]
    previousPeriod: DimensionEntry[]
}

type Props = {
    maxLabel: string
    maxValue?: number
    averageLabel: string
    maxDate?: string
    average?: RingValue
    data?: DimensionData
    valueFormatter?: ValueFormatter
    chartTitle?: string
}

const _default = defineComponent<Props>(p => {
    const isXs = useXsState()

    return () => (
        <Flex flex={2} column gap={1}>
            <Flex v-show={!isXs.value} gap={1}>
                <Flex flex={1} style={GRID_CELL_STYLE}>
                    <KanbanIndicatorCell
                        mainName={p.maxLabel}
                        mainValue={p.valueFormatter ? p.valueFormatter(p.maxValue) : p.maxValue?.toString() || '-'}
                        subValue={p.maxDate ? `@${cvt2LocaleTime(p.maxDate)}` : ''}
                    />
                </Flex>
                <Flex flex={1} style={GRID_CELL_STYLE}>
                    <KanbanIndicatorCell
                        mainName={p.averageLabel}
                        mainValue={formatValue(p.average?.[0], p.valueFormatter)}
                        subRing={p.average}
                        valueFormatter={p.valueFormatter}
                    />
                </Flex>
            </Flex>
            <Box height={isXs.value ? 200 : 281} style={GRID_CELL_STYLE}>
                <Chart
                    data={p.data?.thisPeriod}
                    previous={p.data?.previousPeriod}
                    valueFormatter={p.valueFormatter}
                    title={p.chartTitle}
                />
            </Box>
        </Flex>
    )
}, { props: ['average', 'averageLabel', 'chartTitle', 'data', 'maxDate', 'maxLabel', 'maxValue', 'valueFormatter'] })

export default _default
