/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useCached } from "@hooks"
import { ElSelect } from "element-plus"
import { defineComponent, watch } from "vue"
import { useRoute } from "vue-router"
import { SELECT_WRAPPER_STYLE } from "./common"

type Props = {
    defaultValue?: string
    /**
     * Whether to save the value in the localStorage with {@param historyName}
     */
    historyName?: string
    options: Record<string, string>
    onSelect?: (val: string | undefined) => void
}

const SelectFilterItem = defineComponent<Props>(props => {
    const cacheKey = props.historyName && `__filter_item_select_${useRoute().path}_${props.historyName}`
    const { data, setter } = useCached(cacheKey, props.defaultValue)
    watch(data, val => props.onSelect?.(val))
    return () => (
        <ElSelect
            modelValue={data.value}
            onChange={setter}
            style={SELECT_WRAPPER_STYLE}
            options={Object.entries(props.options).map(([value, label]) => ({ label, value }))}
        />
    )
}, { props: ['defaultValue', 'historyName', 'options', 'onSelect'] })

export default SelectFilterItem