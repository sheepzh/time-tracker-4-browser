import { sendMsg2Runtime } from './common'

export const listPeriods = (param: tt4b.period.Query) => sendMsg2Runtime('period.list', param)