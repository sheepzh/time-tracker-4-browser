import { defineComponent } from "vue"
import { useTopKChart } from '../context'
import Wrapper from "./Wrapper"

const _default = defineComponent(() => {
    const { elRef } = useTopKChart(Wrapper)
    return () => <div style={{ width: '100%' }} ref={elRef} />
})

export default _default