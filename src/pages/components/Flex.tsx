import type { CSSProperties, FunctionalComponent } from "vue"
import { type BaseProps, cvt2BaseStyle, cvtPxScale } from "./common"

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
    rowGap?: string | number
    wrap?: CSSProperties['flexWrap'] | boolean
    href?: string
    target?: HTMLAnchorElement['target']
} & BaseProps

const Flex: FunctionalComponent<Props> = (props, { slots }) => {
    const Comp = props.as ?? 'div'

    return (
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
                rowGap: cvtPxScale(props.rowGap),
                gap: cvtPxScale(props.gap),
                ...cvt2BaseStyle(props),
            }}
            href={props.href}
            target={props.target}
        >
            {slots.default?.()}
        </Comp>
    )
}
Flex.displayName = 'Flex'

export default Flex