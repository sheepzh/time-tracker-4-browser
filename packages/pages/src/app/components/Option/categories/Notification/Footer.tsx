import { sendMsg2Runtime } from '@api/sw/common'
import { t } from '@app/locale'
import { Operation } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { ElButton, ElDivider, ElMessage } from 'element-plus'
import type { FunctionalComponent } from 'vue'

const Footer: FunctionalComponent<{}> = () => {
    const handleTest = () => {
        sendMsg2Runtime('option.testNotification').then(result => {
            if (!result.success) return Promise.reject(new Error(result.errorMsg))
            ElMessage.success('Valid!')
        }).catch(e => {
            const msg = e instanceof Error ? e.message : String(e) ?? 'Unknown error'
            ElMessage.error(msg)
        })
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