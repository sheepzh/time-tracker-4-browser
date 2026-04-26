import { IS_ANDROID, IS_MV3 } from '@util/constant/environment'
import { handleError } from './common'

// NOT SUPPORTED in Firefox
// Keep noticing at chrome.sidebarAction for Firefox
export const SIDE_PANEL_STATE_SUPPORTED_CONTROL = !!chrome.sidePanel?.setOptions

export async function isSidePanelEnabled(): Promise<boolean> {
    if (IS_ANDROID || !SIDE_PANEL_STATE_SUPPORTED_CONTROL) return false

    if (IS_MV3) {
        const result = await chrome.sidePanel.getOptions({})
        return result.enabled ?? true
    } else {
        return new Promise(resolve => chrome.sidePanel.getOptions({}, options => {
            handleError('isSidePanelEnabled')
            resolve(options.enabled ?? true)
        }))
    }
}

export async function setSidePanelEnabled(enabled: boolean): Promise<void> {
    if (IS_ANDROID || !SIDE_PANEL_STATE_SUPPORTED_CONTROL) return

    if (IS_MV3) {
        await chrome.sidePanel.setOptions({ enabled })
    } else {
        return new Promise(resolve => chrome.sidePanel.setOptions({ enabled }, () => {
            handleError('setSidePanelEnabled')
            resolve()
        }))
    }
}