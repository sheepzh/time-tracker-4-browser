/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useEcharts } from '@hooks'
import { computed, defineComponent } from "vue"
import { useHabitFilter } from "../../context"
import TimelineWrapper, { type BizOption } from "./Wrapper"

const _default = defineComponent<{ rows: tt4b.stat.SiteRow[] }>(props => {
    const filter = useHabitFilter()
    const bizOption = computed<BizOption>(() => ({
        rows: props.rows,
        timeFormat: filter.timeFormat,
        dateRange: filter.dateRange,
    }))
    const { elRef } = useEcharts(TimelineWrapper, bizOption, { manual: true })

    return () => <div style={{ width: '100%' }} ref={elRef} />
}, { props: ['rows'] })

export default _default
