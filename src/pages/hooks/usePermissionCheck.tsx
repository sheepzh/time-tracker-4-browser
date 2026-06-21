import { hasPerm, requestPerm } from '@api/chrome/permission'
import { t } from '@i18n'
import sharedMessages, { type SharedMessage } from '@i18n/message/common/shared'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useManualRequest, useRequest } from './useRequest'

export const usePermissionCheck = (target: chrome.runtime.ManifestPermission) => {
    const { data, refresh } = useRequest(() => hasPerm(target))
    const { data: requestSuccess, refreshAsync: request } = useManualRequest(() => requestPerm(target), {
        defaultValue: false,
        onSuccess: granted => {
            if (granted) {
                refresh()
            } else {
                ElMessage.error('Permission request denied')
            }
        },
    })

    const checkOrRequest = async () => {
        if (data.value) return true
        const msg = t<SharedMessage>(sharedMessages, { key: msg => msg.permGrantConfirm })
        return ElMessageBox.confirm(msg, { type: 'primary' })
            .then(async () => {
                await request()
                return requestSuccess.value
            })
            .catch(() => false)
    }

    return { checkOrRequest }
}
