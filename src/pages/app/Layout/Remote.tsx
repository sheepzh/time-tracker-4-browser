import { t } from '@app/locale'
import { UploadFilled } from '@element-plus/icons-vue'
import { Flex } from '@pages/components'
import { ElButton, ElIcon, ElTooltip } from 'element-plus'
import type { FunctionalComponent } from 'vue'

const RemoteFloat: FunctionalComponent<{ value: boolean, onToggle: NoArgCallback }> = ({ value, onToggle }) => (
    <ElTooltip
        placement='left'
        content={t(msg => msg.record.remoteReading[value ? 'on' : 'off'])}
    >
        <Flex style={{ position: 'fixed', right: '10px', bottom: '10px', zIndex: Number.MAX_SAFE_INTEGER }}>
            <ElButton
                size='small'
                style={{ width: '24px', height: '24px' }}
                type={value ? 'primary' : undefined}
                onClick={() => onToggle?.()}
            >
                <ElIcon size={17} style={{ padding: '0 1px' }}>
                    <UploadFilled />
                </ElIcon>
            </ElButton>
        </Flex>
    </ElTooltip>
)
RemoteFloat.displayName = 'RemoteFloat'

export default RemoteFloat