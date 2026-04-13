import { sendMsg2Runtime } from './common'

export const listPeriods = (param: timer.period.Query) => sendMsg2Runtime('period.list', param)