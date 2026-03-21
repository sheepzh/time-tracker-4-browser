import { ArrowDown } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElLink } from "element-plus"
import { type Component, computed, defineComponent, type VNode } from "vue"

export type DropdownButtonItem<T> = {
    key: T
    icon: Component | VNode
    label: string
    onClick?: () => void
}

const DropdownButton = defineComponent<{ items: DropdownButtonItem<unknown>[] }>(props => {
    const trigger = computed(() => props.items?.[0])
    const list = computed(() => props.items.slice(1))

    const handleClick = (key: unknown) => props.items?.find(i => i.key === key)?.onClick?.()

    return () => !!trigger.value && (
        <Flex align="center" gap={3}>
            <ElButton
                link
                type="primary"
                icon={trigger.value?.icon}
                onClick={trigger.value?.onClick}
            >
                {trigger.value?.label ?? 'NaN'}
            </ElButton>
            {!!list.value?.length && (
                <ElDropdown
                    placement="bottom-end"
                    v-slots={{
                        default: () => <ElLink type="primary" underline="never" icon={ArrowDown} />,
                        dropdown: () => (
                            <ElDropdownMenu>
                                {list.value?.map(({ icon, label, key }) => (
                                    <ElDropdownItem icon={icon} onClick={() => handleClick(key)}>
                                        {label}
                                    </ElDropdownItem>
                                ))}
                            </ElDropdownMenu>
                        ),
                    }}
                />
            )}
        </Flex>
    )
}, { props: ['items'] })

export default DropdownButton