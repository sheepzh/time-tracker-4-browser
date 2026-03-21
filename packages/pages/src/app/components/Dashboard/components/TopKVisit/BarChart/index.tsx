import { useEcharts } from "@hooks/useEcharts"
import { defineComponent } from "vue"
import { useTopKValue } from "../context"
import Wrapper from "./Wrapper"

const _default = defineComponent(() => {
    const value = useTopKValue()
    const { elRef } = useEcharts(Wrapper, value, { manual: true })
    return () => <div style={{ width: '100%' }} ref={elRef} />
})

export default _default