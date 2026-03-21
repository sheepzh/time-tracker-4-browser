import { sendMsg2Runtime } from './common'

export function selectPeriods(range: timer.period.KeyRange, size: number) {
    return sendMsg2Runtime('period.select', { range, size })
}