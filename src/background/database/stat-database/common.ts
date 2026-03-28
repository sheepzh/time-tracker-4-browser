import { formatTimeYMD } from '@util/time'

export const GROUP_PREFIX = "_g_"

export const cvtGroupId2Host = (groupId: number): string => `${GROUP_PREFIX}${groupId}`

export const formatDateStr = (date: string | Date): string => {
    if (typeof date === 'string') return date
    return formatTimeYMD(date)
}

export const zeroResult = (): timer.core.Result => ({ focus: 0, time: 0 })

export const zeroRow = (host: string, date: string): timer.core.Row => ({ host, date, focus: 0, time: 0 })

export const increase = (a: timer.core.Result, b: timer.core.Result | undefined) => {
    const res: timer.core.Result = {
        focus: a.focus + (b?.focus ?? 0),
        time: a.time + (b?.time ?? 0),
    }
    const run = (a.run ?? 0) + (b?.run ?? 0)
    run && (res.run = run)
    return res
}
