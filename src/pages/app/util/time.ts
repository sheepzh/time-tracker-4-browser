/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { formatPeriodCommon, MILL_PER_MINUTE, MILL_PER_SECOND } from "@util/time"

/**
 * Convert {yyyy}{mm}{dd} to locale time
 *
 * @param date  {yyyy}{mm}{dd}
 */
export function cvt2LocaleTime(date: string | undefined): string {
    if (!date) return '-'
    const y = date.substring(0, 4)
    const m = date.substring(4, 6)
    const d = date.substring(6, 8)
    if (!y || !m || !d) {
        return '-'
    }
    return t(msg => msg.calendar.dateFormat, { y, m, d })
}

type PeriodFormatOption = {
    format?: timer.app.TimeFormat
    hideUnit?: boolean
}

const UNIT_MAP: { [unit in Exclude<timer.app.TimeFormat, 'default'>]: string } = {
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
