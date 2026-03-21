/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { useAnalysisRows, useAnalysisTimeFormat } from "@app/components/Analysis/context"
import { useEcharts } from "@hooks/useEcharts"
import { computed, defineComponent } from "vue"
import Wrapper, { type BizOption } from "./Wrapper"

const _default = defineComponent(() => {
    const rows = useAnalysisRows()
    const timeFormat = useAnalysisTimeFormat()
    const bizOption = computed<BizOption>(() => ({ rows: rows.value, timeFormat: timeFormat.value }))
    const { elRef } = useEcharts(Wrapper, bizOption, { manual: false })
    return () => <div ref={elRef} style={{ height: '100%', minHeight: '280px' }} />
})

export default _default