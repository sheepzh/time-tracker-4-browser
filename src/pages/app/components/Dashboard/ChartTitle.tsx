import { defineComponent, h, useSlots } from "vue"

const _default = defineComponent<{ text?: string }>(props => {
    const { default: textSlot } = useSlots()
    return () => (
        <div style={{ color: 'var(--el-text-color-primary)', fontWeight: 700, fontSize: '120%' }}>
            {textSlot ? h(textSlot) : <span>{props.text ?? ''}</span>}
        </div>
    )
}, { props: ['text'] })

export default _default