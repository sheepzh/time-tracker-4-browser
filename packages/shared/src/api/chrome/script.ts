import { IS_MV3 } from "@util/constant/environment"
import { handleError } from "./common"

export async function executeScript(tabId: number, files: string[]): Promise<void> {
    if (IS_MV3) {
        try {
            await chrome.scripting.executeScript({ target: { tabId }, files })
        } catch {
            console.warn(`Failed to execute scrips: ${files}`)
        }
    } else {
        await Promise.all(files.map(file => executeScriptMv2(tabId, file)))
    }
}

function executeScriptMv2(tabId: number, file: string): Promise<void> {
    return new Promise(resolve => {
        chrome.tabs.executeScript(tabId, { file }, () => {
            handleError('executeScript')
            resolve()
        })
    })
}