/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import CategoryFilter from "@app/components/common/filter/CategoryFilter"
import DateRangeFilterItem from "@app/components/common/filter/DateRangeFilterItem"
import InputFilterItem from '@app/components/common/filter/InputFilterItem'
import TimeFormatFilterItem from "@app/components/common/filter/TimeFormatFilterItem"
import { t } from "@app/locale"
import Flex from "@pages/components/Flex"
import { type ElementDatePickerShortcut } from "@pages/element-ui/date"
import { daysAgo } from "@util/time"
import { defineComponent } from "vue"
import { useReportFilter } from "../context"
import BatchDelete from "./BatchDelete"
import DownloadFile from "./DownloadFile"
import MergeFilterItem from "./MergeFilterItem"
import RemoteClient from "./RemoteClient"

function datePickerShortcut(text: string, agoOfStart?: number, agoOfEnd?: number): ElementDatePickerShortcut {
    const value = daysAgo(agoOfStart || 0, agoOfEnd || 0)
    return { text, value }
}

const dateShortcuts: ElementDatePickerShortcut[] = [
    datePickerShortcut(t(msg => msg.calendar.range.today)),
    datePickerShortcut(t(msg => msg.calendar.range.yesterday), 1, 1),
    datePickerShortcut(t(msg => msg.calendar.range.lastDays, { n: 7 }), 7),
    datePickerShortcut(t(msg => msg.calendar.range.lastDays, { n: 30 }), 30),
    datePickerShortcut(t(msg => msg.calendar.range.lastDays, { n: 60 }), 60),
]

const _default = defineComponent<{}>(() => {
    const filter = useReportFilter()

    return () => (
        <Flex justify="space-between" width="100%" gap={10} wrap>
            <Flex gap={10} wrap>
                <InputFilterItem
                    defaultValue={filter.query}
                    onSearch={str => filter.query = str}
                />
                <DateRangeFilterItem
                    startPlaceholder={t(msg => msg.calendar.label.startDate)}
                    endPlaceholder={t(msg => msg.calendar.label.endDate)}
                    disabledDate={(date: Date | number) => new Date(date) > new Date()}
                    shortcuts={dateShortcuts}
                    modelValue={filter.dateRange}
                    onChange={val => filter.dateRange = val}
                />
                <CategoryFilter
                    disabled={filter.siteMerge === 'domain'}
                    modelValue={filter.cateIds}
                    onChange={val => filter.cateIds = val}
                />
                <TimeFormatFilterItem
                    modelValue={filter.timeFormat}
                    onChange={val => filter.timeFormat = val}
                />
                <MergeFilterItem />
            </Flex>
            <Flex gap={4}>
                <BatchDelete />
                <RemoteClient />
                <DownloadFile />
            </Flex>
        </Flex>
    )
}, { props: ['hideCateFilter'] })

export default _default