/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getWeekStartDay } from '@api/sw/option'
import { tWeekDays } from '@i18n'
import { rotate } from '@util/array'

export async function getWeekDays() {
    const weekStart = await getWeekStartDay()
    const weekDays = tWeekDays().reverse()
    rotate(weekDays, weekStart)
    return weekDays
}

export { cvt2LocaleDate, periodFormatter } from "@pages/util/time"
