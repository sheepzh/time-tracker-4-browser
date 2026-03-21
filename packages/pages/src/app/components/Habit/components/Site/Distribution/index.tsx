/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useEcharts } from "@hooks/useEcharts"
import { computed, defineComponent } from "vue"
import { useHabitFilter } from "../../context"
import { useDateMergedRows } from "../context"
import Wrapper, { type BizOption } from "./Wrapper"

const _default = defineComponent(() => {
    const rows = useDateMergedRows()
    const filter = useHabitFilter()
    const bizOption = computed(() => ({ rows: rows.value, dateRange: filter.dateRange } as BizOption))
    const { elRef } = useEcharts(Wrapper, bizOption, { manual: true })

    return () => <div style={{ width: '100%' }} ref={elRef} />
})

export default _default
