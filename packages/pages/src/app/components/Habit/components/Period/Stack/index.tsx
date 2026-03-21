/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useEcharts } from "@hooks/useEcharts"
import { computed, defineComponent, type StyleValue } from "vue"
import { useHabitFilter } from "../../context"
import { usePeriodValue } from "../context"
import Wrapper, { type BizOption } from "./Wrapper"

const CONTAINER_STYLE: StyleValue = {
    width: "100%",
    height: "100%",
}

const _default = defineComponent(() => {
    const value = usePeriodValue()
    const globalFilter = useHabitFilter()
    const bizOption = computed<BizOption>(() => ({
        data: value.value?.curr,
        timeFormat: globalFilter.timeFormat,
    }))
    const { elRef } = useEcharts(Wrapper, bizOption, { manual: true })
    return () => <div style={CONTAINER_STYLE} ref={elRef} />
})

export default _default