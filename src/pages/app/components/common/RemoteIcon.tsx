import { UploadFilled } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import type { FunctionalComponent } from 'vue'

export const RemoteIcon: FunctionalComponent<{ visible?: boolean }> =
    ({ visible }) => !!visible && <ElIcon><UploadFilled /></ElIcon>

