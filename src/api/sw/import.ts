import { sendMsg2Runtime } from "./common"

function preview(req: timer.imported.PreviewQuery) {
    return sendMsg2Runtime('import.preview', req)
}

export function previewBackupImport(param: timer.backup.RemoteQuery) {
    return preview({ source: 'backup', param })
}

export function previewImportRows(rows: timer.imported.Row[]) {
    return preview({ source: 'rows', rows })
}

export function processImportedData(query: timer.imported.ProcessQuery) {
    return sendMsg2Runtime('import.processImportedData', query)
}
