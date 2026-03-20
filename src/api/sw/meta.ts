/**
 * Meta domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime-sender"

export function saveFlag(flag: timer.ExtensionMetaFlag) {
    return sendMsg2Runtime('meta.saveFlag', flag)
}

export function getCid() {
    return sendMsg2Runtime('meta.getCid')
}

export function increaseApp(routePath: string) {
    return sendMsg2Runtime('meta.increaseApp', routePath)
}

export function increasePopup() {
    return sendMsg2Runtime('meta.increasePopup')
}

export function recommendRate() {
    return sendMsg2Runtime('meta.recommendRate')
}
