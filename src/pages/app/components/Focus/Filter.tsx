import { t } from '@app/locale'
import { Plus } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { ElButton } from 'element-plus'
import { defineComponent } from 'vue'

const Filter = defineComponent(() => {
    return () => (
        <Flex justify='end'>
            <ElButton type='primary' icon={Plus}>
                {t(msg => msg.shared.focus.addPreset)}
            </ElButton>
        </Flex>
    )
})

export default Filter