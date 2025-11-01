import { type CSSProperties, defineComponent, h, useSlots } from "vue"
import { ALL_BASE_PROPS, type BaseProps, cvt2BaseStyle, cvtPxScale } from "./common"

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
    gap?: string | number
    columnGap?: string | number
    wrap?: CSSProperties['flexWrap'] | boolean
    href?: string
    target?: HTMLAnchorElement['target']
} & BaseProps

const Flex = defineComponent<Props>(props => {
    const { default: defaultSlots } = useSlots()
    const Comp = props.as ?? 'div'

    return () => (
        <Comp
            id={props.id}
            class={props.class}
            onClick={props.onClick}
            style={{
                display: props.inline ? 'inline-flex' : 'flex',
                flex: props.flex,
                flexDirection: props?.column ? 'column' : props.direction,
                alignItems: props.align,
                justifyContent: props.justify,
                flexWrap: cvtFlexWrap(props.wrap),
                columnGap: cvtPxScale(props.columnGap),
                gap: cvtPxScale(props.gap),
                ...cvt2BaseStyle(props),
            }}
            href={props.href}
            target={props.target}
        >
            {defaultSlots && h(defaultSlots)}
        </Comp>
    )
}, { props: [...ALL_BASE_PROPS, 'direction', 'column', 'flex', 'align', 'justify', 'gap', 'columnGap', 'wrap', 'as'] })

export default Flex