import { h, type CSSProperties, type FunctionalComponent } from "vue"
import { ALL_BASE_PROPS, cvtPxScale, wrapStyle, type BaseProps } from "./common"

const cvtFlexWrap = (wrap: boolean | CSSProperties['flexWrap']): CSSProperties['flexWrap'] => {
    if (typeof wrap === 'string') return wrap
    if (wrap === true) return 'wrap'
    return undefined
}

type Props = {
    as?: keyof HTMLElementTagNameMap
    direction?: CSSProperties['flexDirection']
    column?: boolean
    flex?: number
    align?: CSSProperties['alignItems']
    justify?: CSSProperties['justifyContent']
    shrink?: CSSProperties['flexShrink']
    gap?: string | number
    columnGap?: string | number
    rowGap?: string | number
    wrap?: CSSProperties['flexWrap'] | boolean
    href?: string
    target?: HTMLAnchorElement['target']
} & BaseProps

const _Flex: FunctionalComponent<Props> = ({ onClick, href, target, as, ...props }, { slots, attrs }) => {
    const style = wrapStyle(props, {
        flex: props.flex,
        flexDirection: props.column ? 'column' : props.direction,
        alignItems: props.align,
        justifyContent: props.justify,
        flexWrap: cvtFlexWrap(props.wrap),
        flexShrink: props.shrink,
        columnGap: cvtPxScale(props.columnGap),
        rowGap: cvtPxScale(props.rowGap),
        gap: cvtPxScale(props.gap),
    })
    style.display = props.inline ? 'inline-flex' : 'flex'
    return h(as ?? 'div', { ...attrs, onClick, style, href, target }, slots)
}
_Flex.displayName = 'Flex'
_Flex.props = [
    ...ALL_BASE_PROPS,
    'as', 'direction', 'column', 'flex', 'align', 'justify', 'shrink', 'gap', 'columnGap', 'rowGap', 'wrap', 'href', 'target',
]

export default _Flex