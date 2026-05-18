import { sendMsg2Runtime } from "./common"

export const listLimits = (query?: tt4b.limit.Query) => sendMsg2Runtime('limit.list', query)

export const getLimitSummary = () => sendMsg2Runtime('limit.summary')

export const deleteLimits = (ids: number[]) => sendMsg2Runtime('limit.delete', ids)

export const updateLimits = (rules: tt4b.limit.Rule[]) => sendMsg2Runtime('limit.update', rules)

export const addLimit = (rule: Omit<tt4b.limit.Rule, 'id'>) => sendMsg2Runtime('limit.add', rule)
