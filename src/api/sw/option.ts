/**
 * Option domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/sw/common"

export function getOption() {
    return sendMsg2Runtime('option.get')
}

export function setOption(option: Partial<timer.option.AllOption>) {
    return sendMsg2Runtime('option.set', option)
}

export async function getWeekStartTime(now?: number | Date): Promise<Date> {
    let nowTs = typeof now === 'number' ? now : now?.getTime()
    nowTs = nowTs ?? Date.now()
    const startTs = await sendMsg2Runtime('option.weekStartTime', nowTs)
    return new Date(startTs)
}

export function getWeekStartDay() {
    return sendMsg2Runtime('option.weekStartDay')
}
