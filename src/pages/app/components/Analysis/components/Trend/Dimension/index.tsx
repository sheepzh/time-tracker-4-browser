/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import type { DimensionData, DimensionEntry } from '@app/components/Analysis/types'
import { formatValue } from "@app/components/Analysis/util"
import { GRID_CELL_STYLE } from '@app/components/common/grid'
import { KanbanIndicatorCell } from '@app/components/common/kanban'
import type { RingValue, ValueFormatter } from '@app/components/common/kanban/types'
import { cvt2LocaleDate } from '@app/util/time'
import { useEcharts, useXsState } from '@hooks'
import { Box, Flex } from '@pages/components'
import { defineComponent } from "vue"
import { useAnalysisTrendCircle } from '../context'
import Wrapper, { type BizOption } from './Wrapper'

type Props = {
    maxLabel: string
    max?: DimensionEntry
    averageLabel: string
    average?: RingValue
    data?: DimensionData
    valueFormatter: ValueFormatter
    chartTitle: string
}

const _default = defineComponent<Props>(p => {
    const isXs = useXsState()
    const circle = useAnalysisTrendCircle()
    const { elRef } = useEcharts(Wrapper, () => ({
        dimension: p.data,
        title: p.chartTitle,
        valueFormatter: p.valueFormatter,
        circle: circle.value,
    } satisfies BizOption), {
        deps: [() => p.data, () => p.valueFormatter, circle],
    })

    return () => (
        <Flex flex={2} column gap={1}>
            <Flex v-show={!isXs.value} gap={1}>
                <Flex flex={1} style={GRID_CELL_STYLE}>
                    <KanbanIndicatorCell
                        mainName={p.maxLabel}
                        mainValue={formatValue(p.max?.value, p.valueFormatter)}
                        subValue={`@${cvt2LocaleDate(p.max?.date, p.max?.endDate)}`}
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
                <div ref={elRef} style={{ width: "100%", height: "100%" }} />
            </Box>
        </Flex>
    )
}, { props: ['average', 'averageLabel', 'chartTitle', 'data', 'max', 'maxLabel', 'valueFormatter'] })

export default _default
