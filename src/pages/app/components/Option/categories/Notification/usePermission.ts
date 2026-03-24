import { hasPerm, requestPerm } from '@api/chrome/permission'
import { useState } from '@hooks/useState'
import { IS_FIREFOX } from '@util/constant/environment'
import { ElMessage } from 'element-plus'
import { onBeforeMount, reactive } from 'vue'

const DATA_PERM: browser._manifest.OptionalDataCollectionPermission = 'technicalAndInteraction'
const BASE_PERM: chrome.runtime.ManifestPermission = 'notifications'

const usePermission = () => {
    const granted = reactive<Record<timer.notification.Method, boolean>>({
        browser: false,
        callback: false,
    })

    let toCheck: timer.notification.Method | undefined
    let _onRequested: NoArgCallback | undefined

    const [confirmVisible, setConfirmVisible] = useState(false)

    onBeforeMount(async () => {
        if (IS_FIREFOX) {
            const perm = await browser?.permissions?.getAll()
            granted.callback = !!perm?.data_collection?.includes?.(DATA_PERM)
        } else {
            granted.callback = true
        }
        granted.browser = await hasPerm(BASE_PERM)
    })

    const checkBeforeRequest = (method: timer.notification.Method, onRequested: NoArgCallback) => {
        if (granted[method]) {
            onRequested()
        } else {
            _onRequested = onRequested
            toCheck = method
            setConfirmVisible(true)
        }
    }

    const doRequest = async () => {
        // Invalid method to check
        if (!toCheck) return

        const result = toCheck === 'browser'
            ? await requestPerm(BASE_PERM)
            // Need't require data permission if not Firefox
            : !IS_FIREFOX || await browser?.permissions?.request({ data_collection: [DATA_PERM] })
        result ? _onRequested?.() : ElMessage.info('Denied by user')
        granted[toCheck] = result
        setConfirmVisible(false)
    }

    return { granted, confirmVisible, setConfirmVisible, checkBeforeRequest, doRequest }
}

export default usePermission