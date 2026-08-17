/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Search } from "@element-plus/icons-vue"
import { useHotKey, useKeyPressed, useState } from "@hooks"
import { cvtPxScale } from '@pages/components/common'
import Flex from '@pages/components/Flex'
import { Enter } from '@pages/icons'
import { colorUsage, colorVariant, textColor } from '@pages/util/style'
import { IS_ANDROID, IS_MAC } from '@util/constant/environment'
import { ElIcon, ElInput, type InputInstance } from "element-plus"
import { defineComponent, type FunctionalComponent, nextTick, ref, type StyleValue } from "vue"

const SHORTCUT = "K"

const KeyButtonIcon: FunctionalComponent<{ active?: boolean }> = (props, { slots }) => (
    <Flex
        as='span' inline
        justify='center' align='center'
        lineHeight={20} height={22} padding="0 2px"
        fontSize={13}
        boxSizing='border-box'
        color={`var(${props.active ? colorVariant('primary') : textColor('secondary')})`}
        bgColor={props.active ? `var(${colorVariant('primary', 'light', 9)})` : 'transparent'}
        style={{
            minWidth: '22px',
            borderRadius: '6px',
            border: `1px solid var(${props.active ? colorVariant('primary') : colorUsage('border')})`,
            transition: 'all .15s ease',
            userSelect: 'none',
        }}
    >
        {slots.default?.()}
    </Flex>
)

type Props = {
    defaultValue?: string
    placeholder?: string
    width?: number | string
    onSearch?: ArgCallback<string>
}

const InputFilter = defineComponent<Props>(props => {
    const initial = props.defaultValue ?? ''
    const modelValue = ref(initial)
    let lastSearch = initial

    const [focused, setFocused] = useState(false)
    const inputRef = ref<InputInstance>()
    const modifierPressed = useKeyPressed('Meta', 'Control')
    const doSearch = () => {
        lastSearch = modelValue.value = modelValue.value.trim()
        props.onSearch?.(lastSearch)
    }

    const handleBlur = () => {
        setFocused(false)
        doSearch()
    }

    const handleKeydown = (ev: Event | KeyboardEvent) => {
        if (!(ev instanceof KeyboardEvent)) return
        const { key } = ev
        if (key === 'Enter') {
            doSearch()
        } else if (key === 'Escape') {
            modelValue.value = lastSearch
            inputRef.value?.blur()
        }
    }

    useHotKey(
        ev => (ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === SHORTCUT.toLowerCase(),
        ev => {
            ev.preventDefault()
            inputRef.value?.focus()
            nextTick(() => inputRef.value?.select())
        }
    )

    return () => (
        <ElInput
            ref={inputRef}
            modelValue={modelValue.value}
            placeholder={props.placeholder}
            onInput={val => modelValue.value = val}
            onKeydown={handleKeydown}
            onBlur={handleBlur}
            onFocus={() => setFocused(true)}
            style={{ width: cvtPxScale(props.width) ?? '180px' } satisfies StyleValue}
            prefixIcon={Search}
            v-slots={{
                suffix: () => {
                    if (IS_ANDROID) return null
                    if (focused.value) return <ElIcon><Enter /></ElIcon>
                    return (
                        <Flex gap={4} marginInline='0 2px'>
                            <KeyButtonIcon active={modifierPressed.value}>
                                {IS_MAC ? '⌘' : '^'}
                            </KeyButtonIcon>
                            <KeyButtonIcon>{SHORTCUT}</KeyButtonIcon>
                        </Flex>
                    )
                }
            }}
        />
    )
}, { props: ['defaultValue', 'placeholder', 'width', 'onSearch'] })

export default InputFilter