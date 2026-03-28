import { sendMsg2Runtime } from "./common";

export function selectAllMergeRules() {
    return sendMsg2Runtime('mergeRule.selectAll')
}

export function removeMergeRule(origin: string) {
    return sendMsg2Runtime('mergeRule.remove', origin)
}

export function addMergeRule(rule: timer.merge.Rule) {
    return sendMsg2Runtime('mergeRule.add', rule)
}