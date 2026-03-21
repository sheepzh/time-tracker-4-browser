import { defineComponent, h, useSlots } from "vue"
import { ALL_BASE_PROPS, type BaseProps, cvt2BaseStyle } from "./common"

const Box = defineComponent<BaseProps>(props => {
    const { default: defaultSlots } = useSlots()

    return () => (
        <div
            id={props.id}
            class={props.class}
            onClick={props.onClick}
            style={{
                display: props.inline ? 'inline-block' : 'block',
                ...cvt2BaseStyle(props),
            }}
        >
            {defaultSlots && h(defaultSlots)}
        </div>
    )
}, { props: ALL_BASE_PROPS })

export default Box