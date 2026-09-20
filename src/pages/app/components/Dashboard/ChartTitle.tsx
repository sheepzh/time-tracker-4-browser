import { Box, Flex } from '@pages/components'
import type { FunctionalComponent } from "vue"
import { RemoteIcon } from '../common/RemoteIcon'

const _default: FunctionalComponent<{ text?: string, remote?: boolean }> = ({ text, remote }, { slots }) => (
    <Box fontSize={15} fontWeight={700} color='text-primary'>
        {slots.default?.() ?? (
            <Flex as='span' align='center' gap={3}>
                {text ?? '-'}
                <RemoteIcon visible={remote} />
            </Flex>
        )}
    </Box>
)

export default _default