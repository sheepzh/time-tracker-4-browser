/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import CompositionTable from "@app/components/Report/components/CompositionTable"
import { useReportFilter } from "@app/components/Report/context"
import type { ReportSort } from "@app/components/Report/types"
import { t } from '@app/locale'
import TooltipWrapper from '@pages/components/TooltipWrapper'
import { getComposition } from "@util/stat"
import { Effect, ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"

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