/**
 * Memory domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime-sender"

export type MemoryInfo = { used: number; total: number }

export function getUsedStorage() {
    return sendMsg2Runtime('memory.getUsedStorage')
}
