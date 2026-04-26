import Flex from '@pages/components/Flex'
import { useLimitSummary } from '@popup/context'
import { t } from '@popup/locale'
import { ElResult } from 'element-plus'
import { computed, defineComponent, type FunctionalComponent } from 'vue'
import Chart from './Chart'

const Empty: FunctionalComponent<{}> = () => (
    <Flex column align="center" justify="center" height='100%' gap={20}>
        <ElResult
            icon='info'
            title={t(msg => msg.limit.noData)}
        />
    </Flex>
)

const Content = defineComponent<{}>(() => {
    const { limitSummary: summary, selectedLimit } = useLimitSummary()
    const item = computed(() => summary.value?.items.find(i => i.id === selectedLimit.value))

    return () => item.value ? <Chart item={item.value} /> : <Empty />
})

export default Content