/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import TooltipWrapper from "@app/components/common/TooltipWrapper"
import { t } from "@app/locale"
import { getComposition } from "@util/stat"
import { Effect, ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"
import CompositionTable from "../../CompositionTable"
import { useReportFilter } from "../../context"
import type { ReportSort } from "../../types"

const VisitColumn = defineComponent(() => {
    const filter = useReportFilter()
    return () => (
        <ElTableColumn
            prop={'time' satisfies ReportSort['prop']}
            label={t(msg => msg.item.time)}
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
                        default: () => row.time?.toString?.() ?? '0',
                        content: () => <CompositionTable data={getComposition(row, 'time')} />,
                    }}
                />
            )}
        </ElTableColumn>
    )
})

export default VisitColumn