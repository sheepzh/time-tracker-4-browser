import { sendMsg2Runtime } from "./common"

export const syncData = () => sendMsg2Runtime('backup.sync', undefined, 120_000)

export const checkAuth = () => sendMsg2Runtime('backup.checkAuth')

export const clearBackup = (cid: string) => sendMsg2Runtime('backup.clear', cid, 60_000)

export const queryBackup = (param: timer.backup.RemoteQuery) => sendMsg2Runtime('backup.query', param, 120_000)

export const previewBackup = (param: timer.backup.RemoteQuery) => sendMsg2Runtime('backup.preview', param, 120_000)

export const getLastBackUp = (type: timer.backup.Type) => sendMsg2Runtime('backup.lastTs', type)

export const allBackupClients = () => sendMsg2Runtime('backup.clients')
