import { sendMsg2Runtime } from './common'

export function selectPeriods(param: timer.period.Query) {
    return sendMsg2Runtime('period.list', param)
}