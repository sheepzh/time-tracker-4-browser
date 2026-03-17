/**
 * Immigration domain: request to sw. Variable requestImmigration for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

const requestImmigration = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`immigration.${code}` as timer.mq.ReqCode, data)

export function importData(data: unknown) {
    return requestImmigration<unknown, void>('importData', data)
}

export function exportData() {
    return requestImmigration<void, timer.backup.ExportData>('exportData')
}
