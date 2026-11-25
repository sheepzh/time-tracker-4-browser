import StatDay from '@/shared/day'
import { listSiteStats } from '@api/sw/stat'
import { useDayOffset, useRequest, useShadow } from '@hooks'
import { computed } from 'vue'

export const useDatePicker = () => {
    const { dayStart } = useDayOffset()
    const [date, setDate] = useShadow(() => StatDay.today(dayStart.value).toLabel())
    const day = computed(() => StatDay.ofLabel(date.value))

    const { data: dataDates, refresh: refreshDates } = useRequest(async (dateInMonth: Date) => {
        const day = StatDay.of(dateInMonth, dayStart.value)
        const start = day.monthStart().addDays(-14).toString()
        const end = day.monthEnd().addDays(14).toString()

        const stats = await listSiteStats({ date: [start, end], remote: false })
        const dateSet = new Set<string>()
        stats.forEach(({ date }) => date && dateSet.add(date))
        return Array.from(dateSet)
    }, { defaultValue: [], defaultParam: [new Date()], deps: dayStart })

    const onPanelChange = (val: Date | Date[], mode: 'year' | 'month') => {
        if (mode !== 'month') return
        const date = Array.isArray(val) ? val[0] : val
        if (!date) return
        refreshDates(date)
    }

    return { dataDates, date, day, setDate, onPanelChange }
}