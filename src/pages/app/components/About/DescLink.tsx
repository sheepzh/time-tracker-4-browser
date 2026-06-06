import { useXsState } from "@hooks"
import Flex from '@pages/components/Flex'
import { ElLink } from "element-plus"
import { type Component, defineComponent, h, useSlots } from "vue"

const _default = defineComponent<{ href?: string, icon?: Component }>(props => {
    const { icon, href } = props
    const isXs = useXsState()

    return () => (
        <ElLink href={href} target="_blank">
            {icon && !isXs.value && <Flex inline width=".8rem" height=".8rem" marginInline="0 4px">
                {h(icon)}
            </Flex>}
            {useSlots().default?.() ?? href ?? ''}
        </ElLink>
    )
}, { props: ['href', 'icon'] })

export default _default