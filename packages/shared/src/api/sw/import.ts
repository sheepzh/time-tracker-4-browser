import { sendMsg2Runtime } from "./common"

export function fillExist(rows: timer.imported.Row[]) {
    return sendMsg2Runtime('import.fillExist', rows)
}

export function processImportedData(data: timer.imported.Data, resolution: timer.imported.ConflictResolution) {
    return sendMsg2Runtime('import.processImportedData', { data, resolution })
}
