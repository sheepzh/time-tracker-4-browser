/**
 * Import domain: request to sw. Variable requestImport for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

const requestImport = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`import.${code}` as timer.mq.ReqCode, data)

export function fillExist(rows: timer.imported.Row[]) {
    return requestImport<timer.imported.Row[], void>('fillExist', rows)
}

export function processImportedData(data: timer.imported.Data, resolution: timer.imported.ConflictResolution) {
    return requestImport<{ data: timer.imported.Data; resolution: timer.imported.ConflictResolution }, void>('processImportedData', { data, resolution })
}
