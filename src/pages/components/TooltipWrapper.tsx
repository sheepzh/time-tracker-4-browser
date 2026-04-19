import { ElTooltip, type UseTooltipProps } from "element-plus"
import { defineComponent, ref, useSlots } from "vue"

type Props = PartialPick<UseTooltipProps, 'placement' | 'effect' | 'trigger' | 'offset'> & {
    usePopover?: boolean
}

const TooltipWrapper = defineComponent<Props>(props => {
    const visible = ref(false)

    return () => (
        <ElTooltip
            visible={props.usePopover && visible.value}
            onUpdate:visible={v => visible.value = v}
            placement={props.placement}
            effect={props.effect}
            offset={props.offset}
            trigger={props.trigger}
            v-slots={useSlots()}
        />
    )
}, { props: ['effect', 'offset', 'placement', 'trigger', 'usePopover'] })

export default TooltipWrapper