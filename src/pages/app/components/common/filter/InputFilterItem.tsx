/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Search } from "@element-plus/icons-vue"
import { useState } from "@hooks"
import { ElIcon, ElInput } from "element-plus"
import { computed, defineComponent, ref, toRef, type StyleValue } from "vue"

const EnterIcon = defineComponent<{ focused?: boolean }>(props => {
    return () => (
        <ElIcon color={props.focused ? 'var(--el-color-primary)' : undefined}>
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5645" width="200" height="200">
                <path d="M417 1c-48.602 0-88 39.399-88 88v346H89c-48.6 0-88 39.399-88 88v412c0 48.6 39.4 88 88 88h314.69c4.341 0.658 8.786 1 13.31 1h517c24.555 0 46.761-10.057 62.724-26.277C1012.943 981.761 1023 959.555 1023 935V523c0-4.524-0.341-8.968-1-13.31V89c0-48.601-39.398-88-88-88H417z m250.036 645.739V389.131c0-27.134 21.977-49.131 49.087-49.131 27.11 0 49.088 21.997 49.088 49.131V745H453.699l31.657 31.657c19.174 19.173 19.167 50.263-0.012 69.441-19.178 19.179-50.268 19.185-69.441 0.013L266 696.207l149.956-149.955c19.179-19.179 50.269-19.185 69.441-0.013 19.172 19.173 19.167 50.263-0.012 69.441l-31.059 31.059h212.71z" />
            </svg>
        </ElIcon>
    )
}, { props: ['focused'] })

type Props = {
    defaultValue?: string
    placeholder?: string
    enter?: boolean
    width?: number | string
    onSearch?: ArgCallback<string>
}

const InputFilterItem = defineComponent<Props>(props => {
    const modelValue = ref(props.defaultValue ?? '')
    const enter = toRef(props, 'enter', true)

    const width = computed(() => {
        const w = props.width
        return typeof w === 'number' ? `${w}px` : (w ?? '180px')
    })

    const [focused, setFocused] = useState(false)

    const handleBlur = () => {
        setFocused(false)
        props.onSearch?.(modelValue.value)
    }
    return () => (
        <ElInput
            modelValue={modelValue.value}
            placeholder={props.placeholder}
            clearable={!enter.value}
            onClear={() => props.onSearch?.(modelValue.value = '')}
            onInput={val => modelValue.value = val.trim()}
            onKeydown={ev => (ev as KeyboardEvent).key === 'Enter' && enter.value && props.onSearch?.(modelValue.value)}
            onBlur={() => handleBlur()}
            onFocus={() => setFocused(true)}
            style={{ width: width.value } satisfies StyleValue}
            suffixIcon={enter.value ? <EnterIcon focused={focused.value} /> : undefined}
            prefixIcon={Search}
        />
    )
}, { props: ['defaultValue', 'enter', 'placeholder', 'width', 'onSearch'] })

export default InputFilterItem