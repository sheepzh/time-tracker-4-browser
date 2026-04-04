import { sendMsg2Runtime } from "./common"

export function selectLimits(cond?: { filterDisabled?: boolean; url?: string; id?: number }) {
    return sendMsg2Runtime('limit.list', cond)
}

export function batchRemoveLimitRules(rules: timer.limit.Rule[]) {
    return sendMsg2Runtime('limit.batchRemove', rules)
}

export function batchUpdateEnabled(rules: timer.limit.Rule[]) {
    return sendMsg2Runtime('limit.batchUpdateEnabled', rules)
}

export function updateDelay(rule: timer.limit.Rule) {
    return sendMsg2Runtime('limit.updateDelay', rule)
}

export function updateLocked(rule: timer.limit.Rule) {
    return sendMsg2Runtime('limit.updateLocked', rule)
}

export function updateLimit(rule: timer.limit.Rule) {
    return sendMsg2Runtime('limit.update', rule)
}

export function createLimit(rule: MakeOptional<timer.limit.Rule, 'id'>) {
    return sendMsg2Runtime('limit.create', rule)
}
