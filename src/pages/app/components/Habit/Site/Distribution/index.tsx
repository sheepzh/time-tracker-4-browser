/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useHabitFilter } from "@app/components/Habit/context"
import { useEcharts } from '@hooks'
import { computed, defineComponent } from "vue"
import Wrapper, { type BizOption } from "./Wrapper"

const _default = defineComponent<{ merged: tt4b.stat.SiteRow[] }>(props => {
    const filter = useHabitFilter()
    const bizOption = computed(() => ({ rows: props.merged, dateRange: filter.dateRange } as BizOption))
    const { elRef } = useEcharts(Wrapper, bizOption, { manual: true })

    return () => <div style={{ width: '100%' }} ref={elRef} />
}, { props: ['merged'] })

export default _default
