import { useEcharts } from '@hooks'
import { defineComponent, toRef } from 'vue'
import Wrapper from './Wrapper'

const Chart = defineComponent<{ item: timer.limit.Item }>(props => {
    const { elRef } = useEcharts(Wrapper, toRef(props, 'item'))
    return () => <div ref={elRef} style={{ width: '100%', flex: 1 }} />
}, { props: ['item'] })

export default Chart