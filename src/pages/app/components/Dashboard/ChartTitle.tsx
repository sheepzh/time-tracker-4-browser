import Box from '@pages/components/Box'
import { defineComponent, h, useSlots } from "vue"

const _default = defineComponent<{ text?: string }>(props => {
    const { default: textSlot } = useSlots()
    return () => (
        <Box fontSize={15} fontWeight={700} color='text-primary'>
            {textSlot ? h(textSlot) : <span>{props.text ?? ''}</span>}
        </Box>
    )
}, { props: ['text'] })

export default _default