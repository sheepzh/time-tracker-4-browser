import { sendMsg2Runtime } from "./common"

export function batchGet(keys: timer.core.RowKey[]) {
    return sendMsg2Runtime('item.batch', keys)
}
