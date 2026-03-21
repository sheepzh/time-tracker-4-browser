/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useCountUp } from '@hooks/useCount'
import { tNum } from '@i18n'
import { computed, defineComponent, toRef } from "vue"

type Props = {
    value: number
    duration?: number
    fontSize?: number
}

const NumberGrow = defineComponent<Props>(props => {
    const value = toRef(props, 'value')
    const { current } = useCountUp({ value, duration: props.duration })
    const text = computed(() => tNum(current.value))
    return () => <a
        style={{
            textDecoration: 'underline',
            fontSize: props.fontSize ? `${props.fontSize}px` : undefined,
        }}
    >{text.value}</a>
}, { props: ['value', 'duration', 'fontSize'] })


export default NumberGrow