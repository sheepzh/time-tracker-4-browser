import { t } from '@i18n'
import messages from "@i18n/message/common/operation"
import { ElMessage } from 'element-plus'
import { useManualRequest } from './useRequest'

type Action<P extends any[]> = (...p: P) => Awaitable<void | false>
type Options = {
    onSuccess?: () => Awaitable<void>
}

export const useOperation = <P extends any[]>(action: Action<P>, options?: Options) => {
    const { refreshAsync } = useManualRequest(action, {
        onSuccess: async (res, ..._args: P) => {
            // Cancelled, don't show success message
            if (res === false) return

            await options?.onSuccess?.()
            ElMessage.success(t(messages, { key: msg => msg.successMsg }))
        },
        onError: e => {
            // Canceled by ElMessageBox, not to be treated as error
            if (e === 'cancel') return
            const msg = typeof e === 'string' ? e : `ERROR: ${e instanceof Error ? e.message : String(e)}`
            ElMessage.error(msg)
        }
    })

    return refreshAsync
}