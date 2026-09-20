/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useCountUp } from '@hooks'
import { tNum } from '@i18n'
import { defineComponent } from "vue"

const NumberGrow = defineComponent<{ value: number, duration?: number }>(props => {
    const { current } = useCountUp({ value: () => props.value, duration: props.duration })
    return () => <a style={{ textDecoration: 'underline' }}>{tNum(current.value)}</a>
}, { props: ['value', 'duration'] })

export default NumberGrow