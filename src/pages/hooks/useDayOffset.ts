import { StatDay } from '@/shared/day'
import { getOption, getWeekStartDay } from '@api/sw/option'
import { locale } from '@i18n'
import { ref, type Ref } from 'vue'
import { useProvide, useProvider } from './useProvider'
import { useRequest } from './useRequest'

const NAMESPACE = "day_offset_provider"

type Context = {
    weekStart: Ref<tt4b.WeekStart>
    today: Ref<StatDay>
}

export const initDayOffset = () => {
    const { data: weekStart } = useRequest(getWeekStartDay, {
        defaultValue: locale === "zh_CN" ? (1 as const) : (7 as const),
    })
    const today = ref(StatDay.today(0))
    const { refresh } = useRequest(() => getOption().then(o => o.dayStart), {
        onSuccess: dayStart => {
            const curr = StatDay.today(dayStart)
            today.value = curr
            const refreshTime = curr.next().startTime(dayStart)
            setInterval(refresh, refreshTime - Date.now() + 1)
        }
    })
    useProvide<Context>(NAMESPACE, { weekStart, today })
    return today
}

export const useDayOffset = () => useProvider<Context, "weekStart" | "today">(NAMESPACE, "weekStart", "today")