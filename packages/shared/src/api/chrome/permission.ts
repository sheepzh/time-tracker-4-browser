import { IS_MV3 } from "@util/constant/environment"
import { handleError } from "./common"

export async function hasPerm(perm: chrome.runtime.ManifestPermissions): Promise<boolean> {
    if (IS_MV3) {
        try {
            return await chrome.permissions.contains({ permissions: [perm] })
        } catch {
            return false
        }
    } else {
        return new Promise(resolve => {
            chrome.permissions.contains({ permissions: [perm] }, res => {
                handleError('hasPerm')
                resolve(!!res)
            })
        })
    }
}

export async function requestPerm(perm: chrome.runtime.ManifestPermissions): Promise<boolean> {
    if (IS_MV3) {
        try {
            return await chrome.permissions.request({ permissions: [perm] })
        } catch {
            return false
        }
    } else {
        return new Promise(resolve => {
            chrome.permissions.request({ permissions: [perm] }, granted => {
                handleError("requestPerm")
                resolve(!!granted)
            })
        })
    }
}

export async function onPermRemoved(callback: ArgCallback<chrome.permissions.Permissions>) {
    chrome.permissions?.onRemoved.addListener(callback)
}