/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isCircle, type Circle } from '@app/components/Analysis/types'
import { DateRangeFilter } from '@app/components/common/filter'
import { I18nKey, t } from "@app/locale"
import { Flex } from '@pages/components'
import type { ElDatePickerShortcut } from "@pages/element-ui/types"
import { daysAgo } from "@util/time"
import { ElRadioButton, ElRadioGroup } from 'element-plus'
import { defineComponent } from "vue"
import { useAnalysisTrendCircle, useAnalysisTrendDateRange } from "./context"

const shortcut = (agoOfStart: number): ElDatePickerShortcut => ({
    text: t(msg => msg.calendar.range.lastDays, { n: agoOfStart }),
    value: daysAgo(agoOfStart - 1, 0),
})

const SHORTCUTS = [7, 15, 30, 90, 180].map(shortcut)

const CIRCLES: Record<Circle, I18nKey> = {
    daily: msg => msg.analysis.trend.daily,
    weekly: msg => msg.analysis.trend.weekly,
}

const _default = defineComponent(() => {
    const dateRange = useAnalysisTrendDateRange()
    const circle = useAnalysisTrendCircle()

    return () => (
        <Flex justify='space-between'>
            <DateRangeFilter
                modelValue={dateRange.value}
                disabledDate={(date: Date) => date.getTime() > new Date().getTime()}
                shortcuts={SHORTCUTS}
                clearable={false}
                shiftStep={circle.value === 'weekly' ? 7 : 1}
                onChange={([s, e]) => s && e && (dateRange.value = [s, e])}
            />
            <ElRadioGroup modelValue={circle.value} onChange={val => isCircle(val) && (circle.value = val)}>
                {Object.entries(CIRCLES).map(([v, l]) => <ElRadioButton value={v} label={t(l)} />)}
            </ElRadioGroup>
        </Flex>
    )
})

export default _default