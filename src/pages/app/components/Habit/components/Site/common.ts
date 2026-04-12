/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getRegularTextColor } from '@pages/util/style'
import { formatTimeYMD, getDayLength, isSameDay } from "@util/time"
import { type TitleComponentOption } from "echarts/components"

export const generateTitleOption = (text: string): TitleComponentOption => {
    const secondaryTextColor = getRegularTextColor()
    return {
        text,
        textStyle: {
            color: secondaryTextColor,
            fontSize: '14px',
            fontWeight: 'normal',
        },
        left: 'center',
        top: '2%',
    }
}

export type SeriesDataItem = {
    value: number
    row: timer.stat.Row
}

/**
 * @param dateRange date range of filter
 * @returns [averageLen, exclusiveToday4Average, exclusiveDate]
 */
export const computeAverageLen = (dateRange: [Date, Date] | undefined): [number, boolean, string | null] => {
    if (!dateRange) return [0, false, null]
    const [start, end] = dateRange
    if (isSameDay(start, end)) return [1, false, null]
    const dateDiff = getDayLength(start, end)
    const endIsTody = isSameDay(end, new Date())
    if (endIsTody) {
        return [dateDiff - 1, true, formatTimeYMD(end)]
    } else {
        return [dateDiff, false, null]
    }
}