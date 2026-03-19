/**
 * Immigration domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

export function importData(data: unknown) {
    return sendMsg2Runtime('immigration.importData', data)
}

export function exportData() {
    return sendMsg2Runtime('immigration.exportData')
}
