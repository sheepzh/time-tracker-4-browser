/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { SelectFilter } from '@app/components/common/filter'
import { t } from '@app/locale'
import Flex from '@pages/components/Flex'
import { ElRadioButton, ElRadioGroup } from 'element-plus'
import { defineComponent } from 'vue'
import { usePeriodFilter } from './context'
import { type ChartType, isChartType, isPeriodSize, type PeriodSize } from './types'

const PERIODS: Record<PeriodSize, string> = {
    1: t(msg => msg.habit.period.sizes.fifteen),
    2: t(msg => msg.habit.period.sizes.halfHour),
    4: t(msg => msg.habit.period.sizes.hour),
    8: t(msg => msg.habit.period.sizes.twoHour),
}

const CHARTS: Record<ChartType, string> = {
    average: t(msg => msg.habit.period.chartType.average),
    trend: t(msg => msg.habit.period.chartType.trend),
    stack: t(msg => msg.habit.period.chartType.stack),
}

const _default = defineComponent(() => {
    const filter = usePeriodFilter()

    return () => (
        <Flex justify="space-between">
            <SelectFilter
                modelValue={`${filter.periodSize}`}
                options={PERIODS}
                onChange={val => {
                    const intVal = parseInt(val ?? '')
                    isPeriodSize(intVal) && (filter.periodSize = intVal)
                }}
            />
            <ElRadioGroup
                modelValue={filter.chartType}
                onChange={val => isChartType(val) && (filter.chartType = val)}
            >
                {Object.entries(CHARTS).map(([value, label]) => <ElRadioButton {...{ value, label }} />)}
            </ElRadioGroup>
        </Flex>
    )
})

export default _default
