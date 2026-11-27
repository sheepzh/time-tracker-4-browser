import { h, type FunctionalComponent } from "vue"
import { ALL_BASE_PROPS, wrapStyle, type BaseProps } from "./common"

const Box: FunctionalComponent<BaseProps> = ({ id, class: cls, onClick, ...props }, { slots, attrs }) => {
    const style = wrapStyle(props, {})
    style.display = props.inline ? 'inline-block' : 'block'
    return h('div', { ...attrs, id, class: cls, onClick, style }, slots)
}
Box.displayName = 'Box'
Box.props = ALL_BASE_PROPS

export default Box
