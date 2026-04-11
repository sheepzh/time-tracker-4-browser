import { sendMsg2Runtime } from "./common"

export function selectLimits(query?: timer.limit.Query) {
    return sendMsg2Runtime('limit.list', query)
}

export function deleteLimits(ids: number[]) {
    return sendMsg2Runtime('limit.delete', ids)
}

export function updateLimits(rules: timer.limit.Rule[]) {
    return sendMsg2Runtime('limit.update', rules)
}

export function createLimit(rule: Omit<timer.limit.Rule, 'id'>) {
    return sendMsg2Runtime('limit.create', rule)
}
