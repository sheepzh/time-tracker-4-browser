import { sendMsg2Runtime } from "./common"

export function selectAllMergeRules() {
    return sendMsg2Runtime('merge.all')
}

export function removeMergeRule(origin: string) {
    return sendMsg2Runtime('merge.remove', origin)
}

export function addMergeRule(rule: timer.merge.Rule) {
    return sendMsg2Runtime('merge.add', rule)
}