import { sendMsg2Runtime } from "./common"

export type MemoryInfo = { used: number; total: number }

export function getUsedStorage() {
    return sendMsg2Runtime('memory.getUsedStorage')
}
