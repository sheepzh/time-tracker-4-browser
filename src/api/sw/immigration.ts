import { sendMsg2Runtime } from "./common"

export function importOther(query: timer.imported.ProcessQuery) {
    return sendMsg2Runtime('immigration.importOther', query)
}
