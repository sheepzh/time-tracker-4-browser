/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Search } from "@element-plus/icons-vue"
import { useState } from "@hooks"
import { Enter } from '@pages/icons'
import { ElIcon, ElInput } from "element-plus"
import { computed, defineComponent, ref, type StyleValue } from "vue"

type Props = {
    defaultValue?: string
    placeholder?: string
    width?: number | string
    onSearch?: ArgCallback<string>
}

const InputFilterItem = defineComponent<Props>(props => {
    const modelValue = ref(props.defaultValue ?? '')

    const width = computed(() => {
        const w = props.width
        return typeof w === 'number' ? `${w}px` : (w ?? '180px')
    })

    const [focused, setFocused] = useState(false)

    const handleBlur = () => {
        setFocused(false)
        props.onSearch?.(modelValue.value)
    }

    const handleKeydown = (ev: Event | KeyboardEvent) => {
        if (ev instanceof KeyboardEvent && ev.key === 'Enter') {
            props.onSearch?.(modelValue.value)
        }
    }

    return () => (
        <ElInput
            modelValue={modelValue.value}
            placeholder={props.placeholder}
            onInput={val => modelValue.value = val.trim()}
            onKeydown={handleKeydown}
            onBlur={handleBlur}
            onFocus={() => setFocused(true)}
            style={{ width: width.value } satisfies StyleValue}
            suffixIcon={(
                <ElIcon color={focused.value ? 'var(--el-color-primary)' : undefined}>
                    <Enter />
                </ElIcon>
            )}
            prefixIcon={Search}
        />
    )
}, { props: ['defaultValue', 'placeholder', 'width', 'onSearch'] })

export default InputFilterItem