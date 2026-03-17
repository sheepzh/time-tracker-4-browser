/**
 * Backup domain: request to sw. Variable requestBackup for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

const requestBackup = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`backup.${code}` as timer.mq.ReqCode, data)

export function syncData() {
    return requestBackup<void, { success: boolean; errorMsg?: string; data?: number }>('syncData')
}

export function checkAuth() {
    return requestBackup<void, { errorMsg?: string }>('checkAuth')
}

export function clearBackup(cid: string) {
    return requestBackup<string, { success: boolean; errorMsg?: string }>('clear', cid)
}

export function queryBackup(param: { start: Date; end: Date; specCid?: string; excludeLocal?: boolean }) {
    return requestBackup<typeof param, timer.backup.Row[]>('query', param)
}

export function getLastBackUp(type: timer.backup.Type) {
    return requestBackup<timer.backup.Type, { ts: number; msg?: string } | undefined>('getLastBackUp', type)
}

export function listBackupClients() {
    return requestBackup<void, { success: boolean; errorMsg?: string; data?: timer.backup.Client[] }>('listClients')
}
