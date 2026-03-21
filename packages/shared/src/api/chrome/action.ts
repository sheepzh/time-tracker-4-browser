import { IS_FIREFOX, IS_MV3 } from "@util/constant/environment"
import { handleError } from "./common"

const action = IS_MV3 ? chrome.action : chrome.browserAction

export function setBadgeText(text: string, tabId: number | undefined): Promise<void> {
    return new Promise(resolve => action?.setBadgeText({ text, tabId }, () => {
        handleError('setBadgeText')
        resolve()
    }))
}

export function setBadgeBgColor(color: string | chrome.extensionTypes.ColorArray | undefined): Promise<void> {
    let realColor: string | chrome.extensionTypes.ColorArray = color ?? (
        // Use null to clear bg color for Firefox
        IS_FIREFOX ? null as unknown as string : [0, 0, 0, 0]
    )
    return new Promise(resolve => action?.setBadgeBackgroundColor({ color: realColor }, () => {
        handleError('setBadgeColor')
        resolve()
    }))
}

export function onIconClick(handler: () => void) {
    // Forbidden popup page first by setting popup empty string
    action.setPopup({ popup: '' }, () => handleError('setPopup'))
    action.onClicked.addListener(() => handler?.())
}