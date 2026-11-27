/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useEcharts } from "@hooks"
import { computed, defineComponent, type StyleValue } from "vue"
import { useHabitFilter } from "../../context"
import { usePeriod } from '../context'
import Wrapper, { BizOption } from "./Wrapper"

const CONTAINER_STYLE: StyleValue = {
    width: "100%",
    height: "100%",
}

const _default = defineComponent(() => {
    const { data } = usePeriod()
    const globalFilter = useHabitFilter()
    const bizOption = computed<BizOption>(() => ({
        data: data.value?.curr,
        timeFormat: globalFilter.timeFormat,
    }))
    const { elRef } = useEcharts(Wrapper, bizOption, { manual: true })
    return () => <div style={CONTAINER_STYLE} ref={elRef} />
})

export default _default