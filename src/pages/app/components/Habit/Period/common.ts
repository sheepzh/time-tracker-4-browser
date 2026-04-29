/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from '@app/locale'
import { formatTime } from "@util/time"
import { type GridComponentOption } from "echarts/components"

export const generateGridOption = () => ({
    top: 30,
    bottom: 40,
    left: 40,
    right: 20,
} satisfies GridComponentOption)

const MONTHS = t(msg => msg.calendar.months).split('|')

export const formatXAxisTime = (time: number, idx: number): string => {
    const date = new Date(time)
    const dateStr = formatTime(date, '{d}{h}{i}{s}')
    const isStartOfMonth = dateStr === '01000000'
    const isStartOfDate = dateStr.endsWith('000000')
    if (idx === 0 || isStartOfMonth) {
        const monthIdx = date.getMonth()
        return MONTHS[monthIdx] ?? `${monthIdx + 1}`
    } else if (isStartOfDate) {
        return date.getDate().toString().padStart(2, '0')
    } else {
        return formatTime(date, "{h}:{i}")
    }
}