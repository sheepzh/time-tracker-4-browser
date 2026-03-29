import { sendMsg2Runtime } from "./common"

export function importData(data: unknown) {
    return sendMsg2Runtime('immigration.importData', data)
}

export function exportData() {
    return sendMsg2Runtime('immigration.exportData')
}
