/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type StatDay } from '@/shared/day'
import { CategoryFilter, DateRangeFilter, InputFilter, TimeFormatFilter } from '@app/components/common/filter'
import type { DateRangeShortcut } from '@app/components/common/filter/DateRangeFilter'
import { t } from '@app/locale'
import { useDayOffset } from '@hooks'
import { Flex } from '@pages/components'
import { defineComponent } from "vue"
import { useRecordFilter } from "../context"
import BatchDelete from "./BatchDelete"
import DownloadFile from "./DownloadFile"
import MergeFilterItem from "./MergeFilterItem"
import RangeFilter from './RangeFilter'

const buildShortCuts = (today: StatDay): DateRangeShortcut[] => [
    { text: t(msg => msg.calendar.range.today), value: today.rangeTo(0) },
    { text: t(msg => msg.calendar.range.yesterday), value: today.prev().rangeTo(0) },
    ...[7, 30, 60].map(n => ({
        text: t(msg => msg.calendar.range.lastDays, { n }),
        value: today.rangeTo(-n),
    })),
]

const _default = defineComponent<{}>(() => {
    const filter = useRecordFilter()
    const { today } = useDayOffset()

    return () => (
        <Flex justify="space-between" width="100%" gap={10} wrap>
            <Flex gap={10} wrap>
                <InputFilter defaultValue={filter.query} onSearch={str => filter.query = str} />
                <DateRangeFilter
                    startPlaceholder={t(msg => msg.calendar.label.startDate)}
                    endPlaceholder={t(msg => msg.calendar.label.endDate)}
                    disabledDate={date => date > today.value}
                    shortcuts={buildShortCuts(today.value)}
                    modelValue={filter.dateRange}
                    onChange={val => filter.dateRange = val}
                />
                <CategoryFilter
                    disabled={filter.siteMerge === 'domain'}
                    modelValue={filter.cateIds}
                    onChange={val => filter.cateIds = val}
                />
                <TimeFormatFilter
                    modelValue={filter.timeFormat}
                    onChange={val => filter.timeFormat = val}
                />
                <RangeFilter
                    time={filter.timeRange}
                    focus={filter.focusRange}
                    onChange={(time, focus) => {
                        filter.timeRange = time
                        filter.focusRange = focus
                    }}
                />
                <MergeFilterItem />
            </Flex>
            <Flex gap={4}>
                <BatchDelete />
                <DownloadFile />
            </Flex>
        </Flex>
    )
})

export default _default