import { sendMsg2Runtime } from '@api/sw/common'
import { useProvide, useProvider, useRequest, useState } from '@hooks'
import { getAllDatesBetween, getStartOfDay, MILL_PER_DAY } from '@util/time'
import { type ShallowRef } from 'vue'
import { formatYAxis } from './common'

/**
 * The days shown in the timeline
 */
export const TIMELINE_DAY_COUNT = 3

const NAMESPACE = 'dashboard-timeline'

type ContextValue = {
    dates: string[]
    activities: ShallowRef<tt4b.timeline.Activity[]>
    merge: ShallowRef<tt4b.timeline.MergeMethod>
    setMerge: ArgCallback<tt4b.timeline.MergeMethod>
}

export const initTimelineContext = () => {
    const end = Date.now()
    const start = getStartOfDay(end - MILL_PER_DAY * (TIMELINE_DAY_COUNT - 1))
    const dates = getAllDatesBetween(start, end, formatYAxis)
    const [merge, setMerge] = useState<tt4b.timeline.MergeMethod>('none')
    const { data: activities } = useRequest(
        () => sendMsg2Runtime('timeline.list', { start, merge: merge.value }),
        {
            deps: [merge],
            defaultValue: [],
        }
    )

    useProvide<ContextValue>(NAMESPACE, { dates, activities, merge, setMerge })
}

export const useTimelineContext = () => useProvider<ContextValue, 'dates' | 'activities' | 'merge' | 'setMerge'>(NAMESPACE,
    'dates', 'activities', 'merge', 'setMerge',
)