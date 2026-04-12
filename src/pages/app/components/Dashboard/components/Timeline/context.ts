import { listTimeline } from '@/api/sw/timeline'
import { getAllDatesBetween, getStartOfDay, MILL_PER_DAY } from '@/util/time'
import { useProvide, useProvider, useRequest, useState } from '@hooks'
import { type ShallowRef } from 'vue'
import { formatYAxis } from './common'

/**
 * The days shown in the timeline
 */
export const TIMELINE_DAY_COUNT = 3

const NAMESPACE = 'dashboard-timeline'

type ContextValue = {
    dates: string[]
    activities: ShallowRef<timer.timeline.Activity[]>
    merge: ShallowRef<timer.timeline.MergeMethod>
    setMerge: ArgCallback<timer.timeline.MergeMethod>
}

export const initTimelineContext = () => {
    const start = getStartOfDay(Date.now() - MILL_PER_DAY * (TIMELINE_DAY_COUNT - 1))
    const dates = getAllDatesBetween(new Date(start), new Date(), formatYAxis)
    const [merge, setMerge] = useState<timer.timeline.MergeMethod>('none')
    const { data: activities } = useRequest(
        () => listTimeline({ start, merge: merge.value }),
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