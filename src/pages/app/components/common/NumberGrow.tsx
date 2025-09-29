/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getNumberSeparator } from "@i18n"
import { CountUp } from "countup.js"
import { defineComponent, onMounted, ref, watch } from "vue"

type Props = {
    value: number
    duration?: number
    fontSize?: number
}

const NumberGrow = defineComponent<Props>(props => {
    const el = ref<HTMLElement>()
    const countUp = ref<CountUp>()

    onMounted(() => {
        const countEl = el.value
        if (!countEl) return
        countUp.value = new CountUp(countEl, props.value, {
            startVal: 0,
            duration: props.duration || 1.5,
            separator: getNumberSeparator(),
        })
        if (countUp.value.error) {
            console.warn(countUp.value.error)
        }
        countUp.value.start()
    })

    watch(() => props.value, newVal => countUp.value?.update(newVal))

    return () => <a
        ref={el}
        style={{ textDecoration: 'underline', fontSize: props.fontSize ? `${props.fontSize}px` : undefined }}
    />
}, { props: ['value', 'duration', 'fontSize'] })


export default NumberGrow