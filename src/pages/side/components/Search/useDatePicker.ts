import { listSiteStats } from '@api/sw/stat'
import { useRequest, useState } from '@hooks'
import { addDays, formatTimeYMD, getMonthTime } from '@util/time'
import { watch } from 'vue'

export const useDatePicker = (options: { onChange: ArgCallback<Date> }) => {
    const { onChange } = options
    const [date, setDate] = useState(new Date())

    watch(date, val => onChange(val))

    const { data: dataDates, refresh: refreshDates } = useRequest(async (dateInMonth: Date) => {
        const [ms, me] = getMonthTime(dateInMonth)
        const start = formatTimeYMD(addDays(ms, -ms.getDay() * 7))
        const end = formatTimeYMD(addDays(me, (6 - me.getDay()) * 7))

        const stats = await listSiteStats({ date: [start, end], remote: false })
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