import { sendMsg2Runtime } from "@api/sw/common"
import { getWeekStartTime as getWeekStartTime_ } from "@util/time"

export const getOption = () => sendMsg2Runtime('option.get')

export const setOption = (option: Partial<tt4b.option.AllOption>) => sendMsg2Runtime('option.set', option)

export const getWeekStartTime = async (now: number | Date): Promise<Date> => {
    const weekStart = await getWeekStartDay()
    return new Date(getWeekStartTime_(now, weekStart))
}

export const getWeekStartDay = () => sendMsg2Runtime('option.weekStartDay')
