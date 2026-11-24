import { getOption, getWeekStartDay } from '@api/sw/option'
import { locale } from '@i18n'
import type { Ref } from 'vue'
import { useProvide, useProvider } from './useProvider'
import { useRequest } from './useRequest'

const NAMESPACE = "day_offset_provider"

type Context = {
    weekStart: Ref<number>
    dayStart: Ref<number>
}

export const initDayOffset = () => {
    const { data: weekStart } = useRequest(getWeekStartDay, { defaultValue: locale === "zh_CN" ? 0 : 6 })
    const { data: dayStart } = useRequest(() => getOption().then(o => o.dayStart), { defaultValue: 0 })
    useProvide<Context>(NAMESPACE, { weekStart, dayStart })
    return dayStart
}

export const useDayOffset = () => useProvider<Context, "weekStart" | "dayStart">(NAMESPACE, "weekStart", "dayStart")