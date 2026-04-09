import { hasPerm, requestPerm } from '@api/chrome/permission'
import { BROWSER_MAJOR_VERSION, IS_FIREFOX } from '@util/constant/environment'
import { ElMessageBox } from 'element-plus'
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

    if (BROWSER_MAJOR_VERSION && BROWSER_MAJOR_VERSION >= 140) {
        return await browser.permissions.request({ data_collection: [DATA_PERM] })
    }

    // Must use message box if firefox version <140
    return new Promise(resolve => ElMessageBox.confirm(
        "This option will transfer your local data to the callback endpoint you specify. Do you agree?",
        {
            confirmButtonText: "Yes, I agree",
            cancelButtonText: "No, I don't agree",
        },
    ).then(() => resolve(true)).catch(() => resolve(false)))
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