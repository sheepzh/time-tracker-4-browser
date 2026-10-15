/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { dateFmt, tMonths } from '@app/locale'
import { type GridComponentOption } from "echarts/components"

export const generateGridOption = () => ({
    top: 30,
    bottom: 40,
    left: 40,
    right: 20,
} satisfies GridComponentOption)

const MONTHS = tMonths()

export const formatXAxisTime = (time: number, idx: number): string => {
    const date = new Date(time)
    const isStartOfDate = !date.getHours() && !date.getMinutes() && !date.getSeconds()
    const isStartOfMonth = isStartOfDate && date.getDate() === 1
    if (idx === 0 || isStartOfMonth) {
        const monthIdx = date.getMonth()
        return MONTHS[monthIdx] ?? `${monthIdx + 1}`
    } else if (isStartOfDate) {
        return date.getDate().toString().padStart(2, '0')
    } else {
        return dateFmt({ hour: "2-digit", hour12: false, minute: "2-digit" }).format(date)
    }
}