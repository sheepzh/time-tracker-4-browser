import Flex from '@pages/components/Flex'
import { ElCard } from 'element-plus'
import type { FunctionalComponent, StyleValue } from 'vue'
import Content from './Content'
import Summary from './Summary'

const Limit: FunctionalComponent<{}> = () => (
    <ElCard style={{ width: '100%' } satisfies StyleValue}>
        <Flex column width='100%' height='100%'>
            <Summary />
            <Content />
        </Flex>
    </ElCard>
)

export default Limit