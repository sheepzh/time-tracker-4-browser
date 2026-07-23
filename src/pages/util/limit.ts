import { t } from '@i18n'
import calendarMessages from '@i18n/message/common/calendar'

const idx2Str = (time: number): string => {
    const hour = Math.floor(time / 60)
    const min = time - hour * 60
    const hourStr = hour.toString().padStart(2, '0')
    const minStr = min.toString().padStart(2, '0')
    return `${hourStr}:${minStr}`
}

export const FULL_PERIOD: Readonly<tt4b.limit.Period> = [0, 60 * 24]

export const period2Str = ([start, end]: tt4b.limit.Period): string => {
    if (start === FULL_PERIOD[0] && end === FULL_PERIOD[1]) {
        return t(calendarMessages, { key: msg => msg.range.allTime })
    }
    return `${idx2Str(start)}-${idx2Str(end)}${start <= end ? '' : '(+1)'}`
}
