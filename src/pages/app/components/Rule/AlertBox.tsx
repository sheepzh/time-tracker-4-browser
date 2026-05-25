import Flex from '@pages/components/Flex'
import { FunctionalComponent } from 'vue'
import AlertLines, { AlertLinesProps } from '../common/AlertLines'

type Props = Pick<AlertLinesProps, 'title' | 'lines'>

const AlertBox: FunctionalComponent<Props> = (props, ctx) => (
    <Flex gap={20} column padding={15}>
        <AlertLines {...props} />
        {ctx.slots.default?.()}
    </Flex>
)
AlertBox.displayName = 'AlertBox'

export default AlertBox