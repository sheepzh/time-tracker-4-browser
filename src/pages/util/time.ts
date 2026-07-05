import { formatPeriodCommon, MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND } from '@util/time'

type PeriodFormatOption = {
    format?: tt4b.ui.TimeFormat | 'auto'
    hideUnit?: boolean
}

const UNIT_MAP: { [unit in Exclude<tt4b.ui.TimeFormat, 'default'>]: string } = {
    second: 's',
    minute: 'm',
    hour: 'h',
}

/**
 * @param milliseconds
 * @param timeFormat
 * @param hideUnit
 */
export function periodFormatter(milliseconds: number | undefined | null, option?: PeriodFormatOption): string {
    let { format = "default", hideUnit } = option || {}
    if (milliseconds === undefined || Number.isNaN(milliseconds) || milliseconds === null) {
        return "-"
    }
    if (format === "default") return formatPeriodCommon(milliseconds)
    if (format === 'auto') {
        if (milliseconds < MILL_PER_MINUTE) format = 'second'
        else if (milliseconds < MILL_PER_HOUR) format = 'minute'
        else format = 'hour'
    }
    let val: string
    if (format === "second") {
        val = Math.floor(milliseconds / MILL_PER_SECOND).toFixed(0)
    } else if (format === "minute") {
        val = (milliseconds / MILL_PER_MINUTE).toFixed(1)
    } else if (format === "hour") {
        val = (milliseconds / (MILL_PER_MINUTE * 60)).toFixed(2)
    } else {
        return '-'
    }
    if (hideUnit) return val
    let unit = UNIT_MAP[format]
    return val + unit
}