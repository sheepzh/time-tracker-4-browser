import { StatDay } from '@/shared/day'
import { sendMsg2Runtime } from '@api/sw/common'
import { useProvide, useProvider, useRequest, useState } from '@hooks'
import { type ShallowRef } from 'vue'

export type TimelineData = {
    days: StatDay[]
    activities: tt4b.timeline.Activity[]
}

export const TIMELINE_DAY_COUNT = 3

const NAMESPACE = 'dashboard-timeline'

type ContextValue = {
    data: ShallowRef<TimelineData>
    merge: ShallowRef<tt4b.timeline.MergeMethod>
    setMerge: ArgCallback<tt4b.timeline.MergeMethod>
}

export const initTimelineContext = () => {
    const [merge, setMerge] = useState<tt4b.timeline.MergeMethod>('none')
    const { data } = useRequest(async () => {
        const today = StatDay.today(0)
        const startDay = today.addDays(1 - TIMELINE_DAY_COUNT)
        const activities = await sendMsg2Runtime('timeline.list', {
            start: startDay.toLabel().getTime(), merge: merge.value,
        })
        const days = Array.from({ length: TIMELINE_DAY_COUNT }, (_, idx) => startDay.addDays(idx))
        return { days, activities } satisfies TimelineData
    }, { deps: merge, defaultValue: { days: [], activities: [] } })

    useProvide<ContextValue>(NAMESPACE, { data, merge, setMerge })
}

export const useTimelineContext = () => useProvider<ContextValue, 'data' | 'merge' | 'setMerge'>(NAMESPACE,
    'data', 'merge', 'setMerge',
)