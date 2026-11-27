/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useHabitFilter } from "@app/components/Habit/context"
import { useDayOffset, useEcharts } from '@hooks'
import { computed, defineComponent } from "vue"
import Wrapper, { type BizOption } from "./Wrapper"

const _default = defineComponent<{ merged: tt4b.stat.SiteRow[] }>(props => {
    const filter = useHabitFilter()
    const { today } = useDayOffset()
    const biz = computed<BizOption>(() => ({ rows: props.merged, dateRange: filter.dateRange, today: today.value }))
    const { elRef } = useEcharts(Wrapper, biz, { manual: true })

    return () => <div style={{ width: '100%' }} ref={elRef} />
}, { props: ['merged'] })

export default _default
