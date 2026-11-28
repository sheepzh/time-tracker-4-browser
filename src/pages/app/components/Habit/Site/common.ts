/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { StatDay, StatRange } from '@/shared/day'
import { getRegularTextColor } from '@pages/util/style'
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
    row: tt4b.stat.Row
}

/**
 * @param dateRange date range of filter
 * @returns [averageLen, exclusiveToday4Average, exclusiveDate]
 */
export const computeAverageLen = (range: StatRange, today: StatDay): [number, boolean, string?] => {
    const days = range.days()
    if (days === 1) return [1, false]
    return range.end.equals(today)
        ? [days - 1, true, range.end.toString()]
        : [days, false]
}