import { hasPerm, requestPerm } from '@api/chrome/permission'
import { IS_FIREFOX } from '@util/constant/environment'
import { onBeforeMount, reactive } from 'vue'

const DATA_PERM: browser._manifest.OptionalDataCollectionPermission = 'technicalAndInteraction'
const BASE_PERM: chrome.runtime.ManifestPermission = 'notifications'

const judgeDataPerm = async () => {
    if (!IS_FIREFOX) return true
    const perm = await browser?.permissions?.getAll()
    return !!perm?.data_collection?.includes?.(DATA_PERM)
}

const doRequestPerm = async (method: timer.notification.Method | undefined): Promise<boolean> => {
    if (!method) return true
    if (method === 'browser') {
        return await requestPerm(BASE_PERM)
    }

    if (!IS_FIREFOX) return true

    return await browser.permissions.request({ data_collection: [DATA_PERM] })
}

const usePermission = () => {
    const granted = reactive<Record<timer.notification.Method, boolean>>({
        browser: false,
        callback: false,
    })

    onBeforeMount(async () => {
        granted.callback = await judgeDataPerm()
        granted.browser = await hasPerm(BASE_PERM)
    })

    const checkRequest = async (method: timer.notification.Method) => {
        // Invalid method to check
        if (granted[method]) return true

        return granted[method] = await doRequestPerm(method)
    }

    return { checkRequest }
}

export default usePermission