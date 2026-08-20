import { formatTimeYMD } from '@util/time'

export const GROUP_PREFIX = "_g_"

export const cvtGroupId2Host = (groupId: number): string => `${GROUP_PREFIX}${groupId}`

export const formatDateStr = (date: string | Date): string => {
    if (typeof date === 'string') return date
    return formatTimeYMD(date)
}

export const zeroResult = (): tt4b.core.Result => ({ focus: 0, time: 0 })

export const zeroRow = (host: string, date: string): tt4b.core.Row => ({ host, date, focus: 0, time: 0 })

export const increase = (a: tt4b.core.Result, b: tt4b.core.Result | undefined): MakeOptionalUndefined<tt4b.core.Result> => {
    return {
        focus: a.focus + (b?.focus ?? 0),
        time: a.time + (b?.time ?? 0),
        run: ((a.run ?? 0) + (b?.run ?? 0)) || undefined,
        media: ((a.media ?? 0) + (b?.media ?? 0)) || undefined,
    }
}
