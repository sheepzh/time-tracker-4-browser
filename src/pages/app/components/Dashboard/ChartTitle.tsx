import { css } from '@emotion/css'
import { useNamespace } from 'element-plus'
import { defineComponent, h, useSlots } from "vue"

const _default = defineComponent<{ text?: string }>(props => {
    const { default: textSlot } = useSlots()

    const ns = useNamespace('radio-button')
    const titleClz = css`
        color: 'var(--el-text-color-primary)';
        fontWeight: 700;
        fontSize: 120%;
        .${ns.e('inner')} {
            padding: 3px 5px;
        }
    `
    return () => (
        <div class={titleClz}>
            {textSlot ? h(textSlot) : <span>{props.text ?? ''}</span>}
        </div>
    )
}, { props: ['text'] })

export default _default