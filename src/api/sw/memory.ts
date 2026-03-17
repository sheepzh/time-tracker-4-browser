/**
 * Memory domain: request to sw. Variable requestMemory for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

export type MemoryInfo = { used: number; total: number }

const requestMemory = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`memory.${code}` as timer.mq.ReqCode, data)

export function getUsedStorage() {
    return requestMemory<void, MemoryInfo>('getUsedStorage')
}
