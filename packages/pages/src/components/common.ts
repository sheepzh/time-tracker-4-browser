import type { CSSProperties, HTMLAttributes } from "vue"

export type BaseProps = Pick<
    CSSProperties,
    | 'position'
    | 'width' | 'height' | 'minHeight' | 'maxWidth' | 'lineHeight'
    | 'boxSizing' | 'cursor'
    | 'padding' | 'paddingBlock' | 'paddingInline'
    | 'margin' | 'marginTop' | 'marginBottom' | 'marginBlock' | 'marginInline'
    | 'fontSize' | 'fontWeight'
>
    & Pick<HTMLAttributes, 'class' | 'id'>
    & {
        inline?: boolean
        color?: 'text-primary' | 'text-secondary' | 'text-regular' | CSSProperties['color']
        bgColor?: CSSProperties['backgroundColor']
        style?: CSSProperties
        onClick?: (ev: MouseEvent) => void
    }

export const ALL_BASE_PROPS: (keyof BaseProps)[] = [
    'margin', 'marginTop', 'marginBottom', 'marginBlock', 'marginInline',
    'maxWidth', 'minHeight', 'width', 'height', 'lineHeight',
    'padding', 'paddingBlock', 'paddingInline',
    'position', 'boxSizing', 'cursor',
    'color', 'fontSize', 'fontWeight', 'bgColor',
    'id', 'class', 'style',
    'inline',
    'onClick',
]

export const cvtPxScale = (val: number | string | undefined): string | undefined => typeof val === 'number' ? `${val}px` : val

const cvtColor = (color: BaseProps['color']): CSSProperties['color'] => {
    if (color === 'text-primary') return 'var(--el-text-color-primary)'
    if (color === 'text-secondary') return 'var(--el-text-color-secondary)'
    if (color === 'text-regular') return 'var(--el-text-color-regular)'
    return color
}

export const cvt2BaseStyle = (props: BaseProps): CSSProperties => ({
    position: props.position,
    width: cvtPxScale(props.width),
    height: cvtPxScale(props.height),
    lineHeight: cvtPxScale(props.lineHeight),
    minHeight: cvtPxScale(props.minHeight),
    boxSizing: props.boxSizing,
    cursor: props.cursor,
    margin: cvtPxScale(props.margin),
    marginInline: cvtPxScale(props.marginInline),
    marginBlock: cvtPxScale(props.marginBlock),
    marginTop: cvtPxScale(props.marginTop),
    marginBottom: cvtPxScale(props.marginBottom),
    maxWidth: cvtPxScale(props.maxWidth),
    padding: cvtPxScale(props.padding),
    paddingBlock: cvtPxScale(props.paddingBlock),
    paddingInline: cvtPxScale(props.paddingInline),
    color: cvtColor(props.color),
    backgroundColor: props.bgColor,
    fontSize: cvtPxScale(props.fontSize),
    fontWeight: props.fontWeight,
    ...props.style,
})