import type { LimitReason } from '@cs/limit/types'
import { defineComponent, toRef } from 'vue'
import Alert from './Alert'
import Footer from './Footer'
import Reason from './Reason'
import { injectLimitReason } from './context'

const LimitView = defineComponent<{ value: LimitReason }>(props => {
    const value = toRef(props, 'value')
    injectLimitReason(value)

    return () => <>
        <Alert />
        <Reason />
        <Footer />
    </>
}, { props: ['value'] })

export default LimitView