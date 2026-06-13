import { Edit } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { ElButton, ElCard } from 'element-plus'
import { defineComponent } from 'vue'

type Props = {
    value: tt4b.focus.Preset
}

const Preset = defineComponent<Props>(_ => {
    return () => (
        <ElCard
            shadow="hover"
            bodyStyle={{}}
            v-slots={{
                footer: () => (
                    <Flex justify="end" gap={4}>
                        <ElButton size="small" text icon={Edit}></ElButton>
                    </Flex>
                )
            }}
        >
            // todo
        </ElCard>
    )
})

export default Preset