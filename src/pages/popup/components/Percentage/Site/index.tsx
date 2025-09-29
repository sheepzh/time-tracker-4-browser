import { useEcharts } from "@hooks/useEcharts"
import { usePopupContext } from "@popup/context"
import { defineComponent, toRef, watch } from "vue"
import { type PercentageResult } from "../query"
import Wrapper from "./Wrapper"

type Props = {
    value: PercentageResult | undefined
}

const Site = defineComponent<Props>(props => {
    const { darkMode } = usePopupContext()
    const data = toRef(props, 'value')
    const { elRef, refresh } = useEcharts(Wrapper, data)
    watch(darkMode, refresh)

    return () => <div ref={elRef} style={{ width: '100%', height: '100%' }} />
}, { props: ['value'] })

export default Site