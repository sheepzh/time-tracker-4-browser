/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { ElSelect, SelectProps } from "element-plus"
import { defineComponent } from "vue"
import { ALL_BASE_FILTER_PROPS, type BaseFilterProps, SELECT_WRAPPER_STYLE, useFilterState } from "./common"

type Props = BaseFilterProps<string | undefined> & Pick<SelectProps, "placeholder"> & {
    options: Record<string, string>
}

const SelectFilterItem = defineComponent<Props>(props => {
    const [data, setter] = useFilterState('select', props)

    return () => (
        <ElSelect
            placeholder={props.placeholder}
            modelValue={data.value}
            onChange={setter}
            style={SELECT_WRAPPER_STYLE}
            options={Object.entries(props.options).map(([value, label]) => ({ label, value }))}
        />
    )
}, { props: [...ALL_BASE_FILTER_PROPS, 'options', 'placeholder'] })

export default SelectFilterItem