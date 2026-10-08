/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getWeekStartDay } from '@api/sw/option'
import { rotate } from '@util/array'
import { t } from "../locale"

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

export async function getWeekDays() {
    const weekStart = await getWeekStartDay()
    const weekDays = t(msg => msg.calendar.weekDays).split('|').reverse()
    rotate(weekDays, weekStart)
    return weekDays
}

export { periodFormatter } from "@pages/util/time"
