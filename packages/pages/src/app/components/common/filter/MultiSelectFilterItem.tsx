import { useCached } from "@hooks"
import { ElSelect } from "element-plus"
import { defineComponent, watch } from "vue"
import { useRoute } from "vue-router"
import { SELECT_WRAPPER_STYLE } from "./common"

type Data = string | number

type Props = {
    defaultValue?: Data[]
    /**
     * Whether to save the value in the localStorage with {@param historyName}
     */
    historyName?: string
    placeholder?: string
    disabled?: boolean
    options?: { value: Data, label?: string }[]
    onChange?: (val: Data[]) => void
}

const MultiSelectFilterItem = defineComponent<Props>(props => {
    const cacheKey = props.historyName && `__filter_item_multi_select_${useRoute().path}_${props.historyName}`
    const { data, setter } = useCached<Data[]>(cacheKey, props.defaultValue)
    watch(data, val => props.onChange?.(val ?? []))

    return () => (
        <ElSelect
            modelValue={data.value}
            onChange={setter}
            multiple
            clearable
            collapseTags
            disabled={props.disabled}
            onClear={() => setter([])}
            placeholder={props.placeholder}
            style={SELECT_WRAPPER_STYLE}
            options={props.options}
        />
    )
}, { props: ['defaultValue', 'historyName', 'placeholder', 'disabled', 'options'] })

export default MultiSelectFilterItem