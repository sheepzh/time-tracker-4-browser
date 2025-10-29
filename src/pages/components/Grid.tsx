import { CSSProperties, defineComponent, h, useSlots } from 'vue'
import { ALL_BASE_PROPS, cvt2BaseStyle, cvtPxScale, type BaseProps } from './common'

type Props = {
    gap?: string | number
    templateColumns?: CSSProperties['gridTemplateColumns']
} & BaseProps

const Grid = defineComponent<Props>(props => {
    const { default: defaultSlots } = useSlots()

    return () => (
        <div
            id={props.id}
            class={props.class}
            onClick={props.onClick}
            style={{
                display: 'grid',
                gap: cvtPxScale(props.gap),
                gridTemplateColumns: props.templateColumns,
                ...cvt2BaseStyle(props),
            }}
        >
            {defaultSlots && h(defaultSlots)}
        </div>
    )
}, { props: [...ALL_BASE_PROPS, 'gap', 'templateColumns'] })

export default Grid