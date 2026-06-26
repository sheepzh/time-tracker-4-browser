import { useSwitch } from '@hooks'
import Flex from '@pages/components/Flex'
import { ElCheckbox, ElIcon, ElLink, ElPopover, ElText } from 'element-plus'
import { type Component, defineComponent, type FunctionalComponent, h, type StyleValue } from 'vue'

export type PopoverInstance = { close: NoArgCallback }

const OptionIcon: FunctionalComponent<{}> = () => (
    <ElIcon size="large" style={{ cursor: 'pointer' } satisfies StyleValue}>
        <svg viewBox="0 0 1024 1024">
            <path d="M800 32H224a192 192 0 0 0-192 192v576a192 192 0 0 0 192 192h576a192 192 0 0 0 192-192V224a192 192 0 0 0-192-192zM189.76 367.04A128 128 0 0 1 436.8 320h315.2a48 48 0 0 1 0 96h-315.84a128 128 0 0 1-246.08-48.96z m516.16 417.92A128 128 0 0 1 587.2 704H272a48 48 0 0 1 0-96h315.84a128 128 0 1 1 118.08 176.96z" />
        </svg>
    </ElIcon>
)

export const OptionPopover = defineComponent<{}>((_, { slots, expose }) => {
    const [visible, , close] = useSwitch()
    expose({ close } satisfies PopoverInstance)

    return () => (
        <ElPopover
            visible={visible.value}
            placement='auto-end'
            onUpdate:visible={v => visible.value = v}
            trigger='click'
            popperStyle={{ width: 'fit-content' }}
            v-slots={{ reference: OptionIcon }}
        >
            <Flex column gap={5}>
                {slots.default?.()}
            </Flex>
        </ElPopover>
    )
})

type CheckboxProps = ModelValue<boolean> & {
    label: string
}

export const OptionCheckbox: FunctionalComponent<CheckboxProps> = ({ modelValue, onChange, label }) => (
    <Flex gap={4} align='center' cursor="pointer">
        <ElCheckbox
            size='small'
            modelValue={modelValue}
            onChange={v => setTimeout(() => onChange?.(!!v))}
        />
        <ElText size='small'>{label}</ElText>
    </Flex>
)

export const OptionLink: FunctionalComponent<{ href: string, icon?: Component }> = ({ href, icon }) => (
    <ElLink
        href={href}
        target='_blank'
        style={{ '--el-link-text-color': 'unset', '--el-link-hover-text-color': 'unset' }}
    >
        {icon ? h(icon) : <OptionIcon />}
    </ElLink>
)
