import { sendMsg2Runtime } from "./common"

export function importOther(query: tt4b.imported.ProcessQuery) {
    return sendMsg2Runtime('immigration.importOther', query, 60_000)
}
