/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import CompositionTable from "@app/components/Record/components/CompositionTable"
import { useRecordFilter } from "@app/components/Record/context"
import type { RecordSort } from "@app/components/Record/types"
import { t } from '@app/locale'
import TooltipWrapper from '@pages/components/TooltipWrapper'
import { getComposition } from "@util/stat"
import { Effect, ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"

const VisitColumn = defineComponent(() => {
    const filter = useRecordFilter()
    return () => (
        <ElTableColumn
            prop={'time' satisfies RecordSort['prop']}
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