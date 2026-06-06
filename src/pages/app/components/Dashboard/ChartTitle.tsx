import Box from '@pages/components/Box'
import type { FunctionalComponent } from "vue"

const _default: FunctionalComponent<{ text?: string }> = ({ text }, { slots }) => (
    <Box fontSize={15} fontWeight={700} color='text-primary'>
        {slots.default?.() ?? <span>{text ?? '-'}</span>}
    </Box>
)

export default _default