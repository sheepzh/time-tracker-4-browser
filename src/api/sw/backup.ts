/**
 * Backup domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

export function syncData() {
    // Timeout = 60s
    return sendMsg2Runtime('backup.syncData', undefined, 60_000)
}

export function checkAuth() {
    return sendMsg2Runtime('backup.checkAuth')
}

export function clearBackup(cid: string) {
    return sendMsg2Runtime('backup.clear', cid)
}

export function queryBackup(param: { start: Date; end: Date; specCid?: string; excludeLocal?: boolean }) {
    return sendMsg2Runtime('backup.query', param)
}

export function getLastBackUp(type: timer.backup.Type) {
    return sendMsg2Runtime('backup.getLastBackUp', type)
}

export function listBackupClients() {
    return sendMsg2Runtime('backup.listClients')
}
