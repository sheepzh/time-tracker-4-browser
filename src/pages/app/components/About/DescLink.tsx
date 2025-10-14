import { ElLink } from "element-plus"
import { defineComponent, h, useSlots } from "vue"
import "./desc-link.sass"

type Icon = "github" | "element-plus" | "echarts" | "vue"

const _default = defineComponent<{ href?: string, icon?: Icon }>(props => {
    const { icon, href } = props
    const { default: default_ } = useSlots()
    return () => (
        <ElLink href={href} target="_blank">
            {icon ? <div class={`i-about-icon i-about-icons-${icon}`} /> : null}
            {default_ ? h(default_) : href ?? ''}
        </ElLink>
    )
}, { props: ['href', 'icon'] })

export default _default