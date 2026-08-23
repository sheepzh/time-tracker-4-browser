/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useEcharts } from "@hooks"
import { computed, defineComponent, type StyleValue } from "vue"
import { usePeriodFilter, usePeriodValue } from "../context"
import type { PeriodRange } from '../types'
import Wrapper, { type BizOption } from "./Wrapper"

const CONTAINER_STYLE: StyleValue = {
    width: "100%",
    height: "100%",
}

const _default = defineComponent<{ range: PeriodRange }>(props => {
    const value = usePeriodValue()
    const filter = usePeriodFilter()
    const bizOption = computed<BizOption>(() => {
        const { curr, prev } = value.value
        const { curr: currRange, prev: prevRange } = props.range
        const { periodSize } = filter
        return {
            curr, prev,
            currRange, prevRange,
            periodSize,
        }
    })
    const { elRef } = useEcharts(Wrapper, bizOption, { manual: true })
    return () => <div style={CONTAINER_STYLE} ref={elRef} />
}, { props: ['range'] })

export default _default