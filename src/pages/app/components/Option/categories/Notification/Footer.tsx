import { t } from '@app/locale'
import { Operation } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import processor from '@/background/service/notification/processor'
import { ElButton, ElDivider, ElMessage } from 'element-plus'
import type { FunctionalComponent } from 'vue'

const Footer: FunctionalComponent<{}> = () => {
    const handleTest = async () => {
        const result = await processor.doSend()
        if (result.success) {
            ElMessage.success('Valid!')
        } else {
            ElMessage.error(`${result.errorMsg}`)
        }
    }

    return <>
        <ElDivider />
        <Flex gap={12} wrap>
            <ElButton type="primary" icon={Operation} onClick={handleTest}>
                {t(msg => msg.button.test)}
            </ElButton>
        </Flex>
    </>
}

export default Footer