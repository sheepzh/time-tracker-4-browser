import { sendMsg2Runtime } from "@api/sw/common"

export const getOption = () => sendMsg2Runtime('option.get')

export const setOption = (option: Partial<timer.option.AllOption>) => sendMsg2Runtime('option.set', option)

export const getWeekStartTime = async (now?: number | Date): Promise<Date> => {
    let nowTs = typeof now === 'number' ? now : now?.getTime()
    nowTs = nowTs ?? Date.now()
    const startTs = await sendMsg2Runtime('option.weekStartTime', nowTs)
    return new Date(startTs)
}

export const getWeekStartDay = () => sendMsg2Runtime('option.weekStartDay')
