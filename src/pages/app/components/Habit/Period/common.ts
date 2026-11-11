/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { dateFmt } from '@app/locale'
import { type GridComponentOption } from "echarts/components"

export const generateGridOption = () => ({
    top: 30,
    bottom: 40,
    left: 40,
    right: 20,
} satisfies GridComponentOption)

export const formatXAxisTime = (time: number, idx: number): string => {
    const date = new Date(time)
    const isStartOfDate = !date.getHours() && !date.getMinutes() && !date.getSeconds()
    const isStartOfMonth = isStartOfDate && date.getDate() === 1
    if (idx === 0 || isStartOfMonth) {
        return dateFmt({ month: 'short' }).format(date)
    } else if (isStartOfDate) {
        return dateFmt({ day: "2-digit" }).format(date)
    } else {
        return dateFmt({ hour: "2-digit", hour12: false, minute: "2-digit" }).format(date)
    }
}