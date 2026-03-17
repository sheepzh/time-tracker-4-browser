/**
 * Limit domain: request to sw. Variable requestLimit for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

const requestLimit = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`limit.${code}` as timer.mq.ReqCode, data)

export function selectLimits(cond?: { filterDisabled?: boolean; url?: string; id?: number }) {
    return requestLimit<{ filterDisabled?: boolean; url?: string; id?: number } | undefined, timer.limit.Item[]>('select', cond)
}

export function removeLimit(item: timer.limit.Item | timer.limit.Item[]) {
    return requestLimit<timer.limit.Item | timer.limit.Item[], void>('remove', item)
}

export function updateEnabled(...items: timer.limit.Item[]) {
    return requestLimit<timer.limit.Item[], void>('updateEnabled', items)
}

export function updateDelay(item: timer.limit.Item) {
    return requestLimit<timer.limit.Item, void>('updateDelay', item)
}

export function updateLocked(item: timer.limit.Item) {
    return requestLimit<timer.limit.Item, void>('updateLocked', item)
}

export function verifyLimit(difficulty: timer.limit.VerificationDifficulty, locale: timer.Locale) {
    return requestLimit<{ difficulty: timer.limit.VerificationDifficulty; locale: timer.Locale }, { prompt?: string; promptParam?: any; answer: string; second: number } | null>('verify', { difficulty, locale })
}

export function updateLimit(...rules: timer.limit.Rule[]) {
    return requestLimit<timer.limit.Rule[], void>('update', rules)
}

export function createLimit(rule: Partial<timer.limit.Rule>) {
    return requestLimit<Partial<timer.limit.Rule>, number>('create', rule)
}
