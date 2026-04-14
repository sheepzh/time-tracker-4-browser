import { sendMsg2Runtime } from "./common"

export const listAllMergeRules = () => sendMsg2Runtime('merge.all')

export const deleteMergeRule = (origin: string) => sendMsg2Runtime('merge.delete', origin)

export const addMergeRule = (rule: timer.merge.Rule) => sendMsg2Runtime('merge.add', rule)