/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { RingValue } from "@app/components/Analysis/util"
import { KanbanIndicatorCell } from "@app/components/kanban"
import { t } from "@app/locale"
import { periodFormatter } from "@app/time"
import Flex from "@pages/components/Flex"
import { defineComponent, type CSSProperties } from "vue"
import { GRID_CELL_STYLE } from "../../../grid"
import { useAnalysisTimeFormat } from "../../context"
import { useAnalysisTrendRangeLength } from "./context"

const computeDayValue = (activeDay: RingValue | undefined, rangeLength: number) => {
    const thisActiveDay = activeDay?.[0]
    return `${thisActiveDay?.toString() || '-'}/${rangeLength?.toString() || '-'}`
}

type Props = Record<'activeDay' | 'visit' | 'focus', RingValue>

const INDICATOR_CONTAINER_STYLE: CSSProperties = {
    ...GRID_CELL_STYLE,
    flex: 1, width: '100%',
}

const _default = defineComponent<Props>(props => {
    const rangeLength = useAnalysisTrendRangeLength()
    const timeFormat = useAnalysisTimeFormat()
    return () => (
        <Flex flex={1} column gap={1}>
            <KanbanIndicatorCell
                mainName={`${t(msg => msg.analysis.trend.activeDay)}/${t(msg => msg.analysis.trend.totalDay)}`}
                mainValue={computeDayValue(props.activeDay, rangeLength.value)}
                subRing={props.activeDay}
                containerStyle={INDICATOR_CONTAINER_STYLE}
            />
            <KanbanIndicatorCell
                mainName={t(msg => msg.analysis.common.focusTotal)}
                mainValue={periodFormatter(props.focus?.[0], { format: timeFormat.value })}
                subRing={props.focus}
                valueFormatter={delta => periodFormatter(delta, { format: timeFormat.value })}
                containerStyle={INDICATOR_CONTAINER_STYLE}
            />
            <KanbanIndicatorCell
                mainName={t(msg => msg.analysis.common.visitTotal)}
                mainValue={props.visit?.[0]?.toString() || '-'}
                subRing={props.visit}
                containerStyle={INDICATOR_CONTAINER_STYLE}
            />
        </Flex>
    )
}, { props: ['activeDay', 'focus', 'visit'] })

export default _default