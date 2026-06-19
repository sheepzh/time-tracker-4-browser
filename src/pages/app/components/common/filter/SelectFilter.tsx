/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { ElSelect, type SelectProps } from "element-plus"
import type { FunctionalComponent } from 'vue'
import { SELECT_WRAPPER_STYLE } from "./common"

type Props = ModelValue<string | undefined> & Pick<SelectProps, "placeholder"> & {
    options: Record<string, string>
}

const SelectFilter: FunctionalComponent<Props> = props => (
    <ElSelect
        placeholder={props.placeholder}
        modelValue={props.modelValue}
        onChange={props.onChange}
        style={SELECT_WRAPPER_STYLE}
        options={Object.entries(props.options).map(([value, label]) => ({ label, value }))}
    />
)
SelectFilter.displayName = 'SelectFilter'

export default SelectFilter