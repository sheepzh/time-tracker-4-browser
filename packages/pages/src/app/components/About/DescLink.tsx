import { useXsState } from '@hooks/useMediaSize'
import Flex from '@pages/components/Flex'
import { ElLink } from "element-plus"
import { defineComponent, h, useSlots } from "vue"
import { type JSX } from 'vue/jsx-runtime'

const _default = defineComponent<{ href?: string, icon?: JSX.Element }>(props => {
    const { icon, href } = props
    const { default: default_, } = useSlots()
    const isXs = useXsState()
    return () => (
        <ElLink href={href} target="_blank">
            {icon && !isXs.value && <Flex inline width=".8rem" height=".8rem" marginInline="0 4px">
                {h(icon)}
            </Flex>}
            {default_ ? h(default_) : href ?? ''}
        </ElLink>
    )
}, { props: ['href', 'icon'] })

export default _default