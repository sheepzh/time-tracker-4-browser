import { t } from '@app/locale'
import { UploadFilled } from '@element-plus/icons-vue'
import { useRemote } from '@hooks'
import { Flex } from '@pages/components'
import { ElButton, ElIcon, ElTooltip } from 'element-plus'
import { defineComponent } from 'vue'

const RemoteFloat = defineComponent<{}>(() => {
    const { available, remote } = useRemote()
    const onToggle = () => available.value && (remote.value = !remote.value)

    return () => available.value && (
        <ElTooltip
            placement='left'
            content={t(msg => msg.record.remoteReading[remote.value ? 'on' : 'off'])}
        >
            <Flex style={{ position: 'fixed', right: '10px', bottom: '10px', zIndex: Number.MAX_SAFE_INTEGER }}>
                <ElButton
                    size='small'
                    style={{ width: '24px', height: '24px' }}
                    type={remote.value ? 'primary' : undefined}
                    onClick={onToggle}
                >
                    <ElIcon size={17} style={{ padding: '0 1px' }}>
                        <UploadFilled />
                    </ElIcon>
                </ElButton>
            </Flex>
        </ElTooltip>
    )
})

export default RemoteFloat