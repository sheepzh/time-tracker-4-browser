/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useEcharts } from "@hooks/useEcharts"
import { computed, defineComponent, type StyleValue } from "vue"
import { usePeriodFilter, usePeriodRange, usePeriodValue } from "../context"
import Wrapper, { type BizOption } from "./Wrapper"

const CONTAINER_STYLE: StyleValue = {
    width: "100%",
    height: "100%",
}

const _default = defineComponent(() => {
    const value = usePeriodValue()
    const filter = usePeriodFilter()
    const periodRange = usePeriodRange()
    const bizOption = computed<BizOption>(() => {
        const { curr, prev } = value.value || {}
        const { curr: currRange, prev: prevRange } = periodRange.value || {}
        const { periodSize } = filter
        return {
            curr, prev,
            currRange, prevRange,
            periodSize,
        }
    })
    const { elRef } = useEcharts(Wrapper, bizOption, { manual: true })
    return () => <div style={CONTAINER_STYLE} ref={elRef} />
})

export default _default