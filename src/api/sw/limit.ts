import { sendMsg2Runtime } from "./common"

export const listLimits = (query?: timer.limit.Query) => sendMsg2Runtime('limit.list', query)

export const getLimitSummary = () => sendMsg2Runtime('limit.summary')

export const deleteLimits = (ids: number[]) => sendMsg2Runtime('limit.delete', ids)

export const updateLimits = (rules: timer.limit.Rule[]) => sendMsg2Runtime('limit.update', rules)

export const addLimit = (rule: Omit<timer.limit.Rule, 'id'>) => sendMsg2Runtime('limit.add', rule)
