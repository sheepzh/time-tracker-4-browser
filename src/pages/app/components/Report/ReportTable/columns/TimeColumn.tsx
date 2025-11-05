/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import TooltipWrapper from "@app/components/common/TooltipWrapper"
import { t } from "@app/locale"
import { periodFormatter } from "@app/util/time"
import { getComposition } from "@util/stat"
import { Effect, ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"
import CompositionTable from '../../CompositionTable'
import { useReportFilter } from "../../context"
import type { ReportSort } from "../../types"

type Props = {
    dimension: timer.core.Dimension & 'focus' | 'run'
}

const TimeColumn = defineComponent<Props>(props => {
    const filter = useReportFilter()
    const formatter = (focus: number | undefined): string => periodFormatter(focus, { format: filter.timeFormat })
    return () => (
        <ElTableColumn
            prop={props.dimension satisfies ReportSort['prop']}
            label={t(msg => msg.item[props.dimension])}
            minWidth={130}
            align="center"
            sortable="custom"
        >
            {({ row }: RenderRowData<timer.stat.Row>) => (
                <TooltipWrapper
                    usePopover={filter.readRemote}
                    placement="top"
                    effect={Effect.LIGHT}
                    offset={10}
                    v-slots={{
                        default: () => formatter(row[props.dimension]),
                        content: () => <CompositionTable valueFormatter={formatter} data={getComposition(row, props.dimension)} />,
                    }}
                />
            )}
        </ElTableColumn >
    )
}, { props: ['dimension'] })

export default TimeColumn