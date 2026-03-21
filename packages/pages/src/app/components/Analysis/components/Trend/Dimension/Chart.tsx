/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type DimensionEntry, type ValueFormatter } from "@app/components/Analysis/util"
import { useEcharts } from "@hooks/useEcharts"
import { defineComponent } from "vue"
import Wrapper from "./Wrapper"

type Props = {
    data?: DimensionEntry[]
    previous?: DimensionEntry[]
    title?: string
    valueFormatter?: ValueFormatter
}

const _default = defineComponent<Props>(props => {
    const { elRef } = useEcharts(Wrapper, () => ({
        entries: props.data,
        preEntries: props.previous,
        title: props.title,
        valueFormatter: props.valueFormatter,
    }), {
        deps: [() => props.data, () => props.valueFormatter],
    })

    return () => <div ref={elRef} style={{ width: '100%', height: '100%' }} />
}, { props: ['data', 'previous', 'title', 'valueFormatter'] })

export default _default
