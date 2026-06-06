import type { FunctionalComponent } from "vue"
import { type BaseProps, cvt2BaseStyle } from "./common"

const Box: FunctionalComponent<BaseProps> = (props, { slots }) => (
    <div
        id={props.id}
        class={props.class}
        onClick={props.onClick}
        style={{
            display: props.inline ? 'inline-block' : 'block',
            ...cvt2BaseStyle(props),
        }}
    >
        {slots.default?.()}
    </div>
)
Box.displayName = 'Box'

export default Box