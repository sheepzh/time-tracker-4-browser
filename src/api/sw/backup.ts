import { sendMsg2Runtime } from "./common"

export function syncData() {
    // Timeout = 60s
    return sendMsg2Runtime('backup.sync', undefined, 60_000)
}

export function checkAuth() {
    return sendMsg2Runtime('backup.checkAuth')
}

export function clearBackup(cid: string) {
    return sendMsg2Runtime('backup.clear', cid)
}

export function queryBackup(param: timer.backup.RemoteQuery) {
    return sendMsg2Runtime('backup.query', param)
}

export function getLastBackUp(type: timer.backup.Type) {
    return sendMsg2Runtime('backup.lastTs', type)
}

export function allBackupClients() {
    return sendMsg2Runtime('backup.clients')
}
