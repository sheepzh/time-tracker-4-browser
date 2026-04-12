import { listSiteStats } from '@api/sw/stat'
import { useRequest, useState } from '@hooks'
import { formatTimeYMD, getMonthTime, MILL_PER_WEEK } from '@util/time'
import { watch } from 'vue'

export const useDatePicker = (options: { onChange: ArgCallback<Date> }) => {
    const { onChange } = options
    const [date, setDate] = useState(new Date())

    watch(date, val => onChange(val))

    const { data: dataDates, refresh: refreshDates } = useRequest(async (dateInMonth: Date) => {
        const [ms, me] = getMonthTime(dateInMonth)
        const start = formatTimeYMD(new Date(ms.getTime() - ms.getDay() * MILL_PER_WEEK))
        const end = formatTimeYMD(new Date(me.getTime() + (6 - me.getDay()) * MILL_PER_WEEK))

        const stats = await listSiteStats({ date: [start, end] })
        const dateSet = new Set<string>()
        stats.forEach(({ date }) => date && dateSet.add(date))
        return Array.from(dateSet)
    }, { defaultValue: [], defaultParam: [new Date()] })

    const onPanelChange = (val: Date | Date[], mode: 'year' | 'month') => {
        if (mode !== 'month') return
        const date = Array.isArray(val) ? val[0] : val
        if (!date) return
        refreshDates(date)
    }

    const disabledDate = (date: Date) => date.getTime() > Date.now()

    return {
        dataDates, date, setDate,
        onPanelChange,
        disabledDate,
    }
}