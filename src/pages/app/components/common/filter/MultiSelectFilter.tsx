import { ElSelect, type SelectProps } from "element-plus"
import { type FunctionalComponent } from "vue"
import { SELECT_WRAPPER_STYLE } from "./common"

type Data = string | number

type Props = ModelValue<Data[]> & Pick<SelectProps, "placeholder"> & {
    options?: { value: Data, label?: string }[]
}

const MultiSelectFilter: FunctionalComponent<Props> = props => (
    <ElSelect
        modelValue={props.modelValue}
        onChange={props.onChange}
        multiple
        clearable
        collapseTags
        onClear={() => props.onChange?.([])}
        placeholder={props.placeholder}
        style={SELECT_WRAPPER_STYLE}
        options={props.options}
    />
)
MultiSelectFilter.displayName = 'MultiSelectFilter'

export default MultiSelectFilter