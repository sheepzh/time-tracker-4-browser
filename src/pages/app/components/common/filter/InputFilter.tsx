/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Search } from "@element-plus/icons-vue"
import { useState } from "@hooks"
import { cvtPxScale } from '@pages/components/common'
import { Enter } from '@pages/icons'
import { ElIcon, ElInput } from "element-plus"
import { defineComponent, ref, type StyleValue } from "vue"

type Props = {
    defaultValue?: string
    placeholder?: string
    width?: number | string
    onSearch?: ArgCallback<string>
}

const InputFilter = defineComponent<Props>(props => {
    const modelValue = ref(props.defaultValue ?? '')

    const [focused, setFocused] = useState(false)

    const handleBlur = () => {
        setFocused(false)
        props.onSearch?.(modelValue.value)
    }

    const handleKeydown = (ev: Event | KeyboardEvent) => {
        if (ev instanceof KeyboardEvent && ev.key === 'Enter') {
            const query = modelValue.value = modelValue.value.trim()
            props.onSearch?.(query)
        }
    }

    return () => (
        <ElInput
            modelValue={modelValue.value}
            placeholder={props.placeholder}
            onInput={val => modelValue.value = val}
            onKeydown={handleKeydown}
            onBlur={handleBlur}
            onFocus={() => setFocused(true)}
            style={{ width: cvtPxScale(props.width) ?? '180px' } satisfies StyleValue}
            suffixIcon={(
                <ElIcon color={focused.value ? 'var(--el-color-primary)' : undefined}>
                    <Enter />
                </ElIcon>
            )}
            prefixIcon={Search}
        />
    )
}, { props: ['defaultValue', 'placeholder', 'width', 'onSearch'] })

export default InputFilter