/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useCached } from "@hooks"
import Flex from "@pages/components/Flex"
import { ElSwitch, ElText } from "element-plus"
import { defineComponent, watch } from "vue"
import { useRoute } from "vue-router"

const _default = defineComponent({
    emits: {
        change: (_val: boolean) => true
    },
    props: {
        label: String,
        defaultValue: Boolean,
        historyName: String,
    },
    setup(props, ctx) {
        const cacheKey = props.historyName ? `__filter_item_switch_${useRoute().path}_${props.historyName}` : undefined
        const { data, setter } = useCached(cacheKey, props.defaultValue)
        watch(data, () => ctx.emit("change", !!data.value))

        return () => (
            <Flex gap={5} align="center">
                <ElText tag="b" type="info">{props.label}</ElText>
                <ElSwitch modelValue={data.value} onChange={val => setter(val as boolean)} />
            </Flex>
        )
    }
})

export default _default