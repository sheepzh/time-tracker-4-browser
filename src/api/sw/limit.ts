/**
 * Limit domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

export function selectLimits(cond?: { filterDisabled?: boolean; url?: string; id?: number }) {
    return sendMsg2Runtime('limit.select', cond)
}

export function removeLimit(item: timer.limit.Item | timer.limit.Item[]) {
    return sendMsg2Runtime('limit.remove', item)
}

export function updateEnabled(...items: timer.limit.Item[]) {
    return sendMsg2Runtime('limit.updateEnabled', items)
}

export function updateDelay(item: timer.limit.Item) {
    return sendMsg2Runtime('limit.updateDelay', item)
}

export function updateLocked(item: timer.limit.Item) {
    return sendMsg2Runtime('limit.updateLocked', item)
}

export function updateLimit(...rules: timer.limit.Rule[]) {
    return sendMsg2Runtime('limit.update', rules)
}

export function createLimit(rule: Partial<timer.limit.Rule>) {
    return sendMsg2Runtime('limit.create', rule)
}
