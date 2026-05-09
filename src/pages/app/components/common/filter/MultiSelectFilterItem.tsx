import { ElSelect } from "element-plus"
import { defineComponent } from "vue"
import { ALL_BASE_FILTER_PROPS, type BaseFilterProps, SELECT_WRAPPER_STYLE, useFilterState } from "./common"

type Data = string | number

type Props = BaseFilterProps<Data[]> & {
    placeholder?: string
    options?: { value: Data, label?: string }[]
}

const MultiSelectFilterItem = defineComponent<Props>(props => {
    const [data, setter] = useFilterState('multi_select', props)

    return () => (
        <ElSelect
            modelValue={data.value}
            onChange={setter}
            multiple
            clearable
            collapseTags
            onClear={() => setter([])}
            placeholder={props.placeholder}
            style={SELECT_WRAPPER_STYLE}
            options={props.options}
        />
    )
}, { props: [...ALL_BASE_FILTER_PROPS, 'placeholder', 'options'] })

export default MultiSelectFilterItem