import { UploadFilled } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import type { FunctionalComponent, StyleValue } from 'vue'

export const RemoteIcon: FunctionalComponent<{ visible?: boolean, style?: StyleValue }> =
    ({ visible, style }) => !!visible && <ElIcon style={style}><UploadFilled /></ElIcon>
