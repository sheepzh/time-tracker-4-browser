/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import SelectFilterItem from '@app/components/common/filter/SelectFilterItem'
import { t } from '@app/locale'
import Flex from '@pages/components/Flex'
import { type HabitMessage } from '@i18n/message/app/habit'
import { ElRadioButton, ElRadioGroup } from 'element-plus'
import { defineComponent } from 'vue'
import { usePeriodFilter } from './context'
import type { ChartType } from './types'

// [value, label]
type _SizeOption = [number, keyof HabitMessage['period']['sizes']]

function allOptions(): Record<number, string> {
    const allOptions: Record<number, string> = {}
    const allSizes: _SizeOption[] = [
        [1, 'fifteen'],
        [2, 'halfHour'],
        [4, 'hour'],
        [8, 'twoHour'],
    ]
    allSizes.forEach(
        ([size, msg]) => (allOptions[size] = t((root) => root.habit.period.sizes[msg]))
    )
    return allOptions
}

const CHART_CONFIG: { [type in ChartType]: string } = {
    average: t(msg => msg.habit.period.chartType.average),
    trend: t(msg => msg.habit.period.chartType.trend),
    stack: t(msg => msg.habit.period.chartType.stack),
}

const _default = defineComponent(() => {
    const filter = usePeriodFilter()

    return () => (
        <Flex justify="space-between">
            <SelectFilterItem
                historyName='periodSize'
                defaultValue={filter.periodSize?.toString?.()}
                options={allOptions()}
                onSelect={val => {
                    if (!val) return
                    const newPeriodSize = parseInt(val)
                    if (isNaN(newPeriodSize)) return
                    filter.periodSize = newPeriodSize
                }}
            />
            <ElRadioGroup
                modelValue={filter.chartType}
                onChange={val => val && (filter.chartType = val as ChartType)}
            >
                {Object.entries(CHART_CONFIG).map(([type, name]) => (
                    <ElRadioButton value={type}>
                        {name}
                    </ElRadioButton>
                ))}
            </ElRadioGroup>
        </Flex>
    )
})

export default _default
