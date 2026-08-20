/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import CompositionTable from '@app/components/Record/components/CompositionTable'
import { useRecordFilter } from "@app/components/Record/context"
import { t } from '@app/locale'
import { periodFormatter } from '@app/util/time'
import TooltipWrapper from '@pages/components/TooltipWrapper'
import { getComposition, isDimension } from "@util/stat"
import { Effect, ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"

type Props = {
    dimension: tt4b.core.Dimension | tt4b.core.DimensionOptional
    sortable?: boolean
}

const TimeColumn = defineComponent<Props>(props => {
    const filter = useRecordFilter()
    const formatter = (focus: number | undefined): string => periodFormatter(focus, { format: filter.timeFormat })
    return () => (
        <ElTableColumn
            prop={props.dimension}
            label={t(msg => msg.item[props.dimension])}
            minWidth={130}
            align="center"
            sortable={props.sortable ?? 'custom'}
        >
            {({ row }: RenderRowData<tt4b.stat.Row>) => (
                <TooltipWrapper
                    usePopover={filter.readRemote && isDimension(props.dimension)}
                    placement="top"
                    effect={Effect.LIGHT}
                    offset={10}
                    v-slots={{
                        default: () => formatter(row[props.dimension]),
                        content: () => <CompositionTable
                            valueFormatter={formatter}
                            data={isDimension(props.dimension) ? getComposition(row, props.dimension) : []}
                        />,
                    }}
                />
            )}
        </ElTableColumn>
    )
}, { props: ['dimension'] })

export default TimeColumn