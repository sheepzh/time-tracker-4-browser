import { useCategories } from '@app/context'
import { t } from '@app/locale'
import mergeRuleDatabase from '@db/merge-rule-database'
import siteDatabase from '@db/site-database'
import { TIMELINE_LIFE_CYCLE } from '@db/timeline-database'
import { useState } from '@hooks'
import CustomizedHostMergeRuler from '@service/components/host-merge-ruler'
import { toMap } from '@util/array'
import { CATE_NOT_SET_ID } from '@util/site'
import { formatTime, getAllDatesBetween, getStartOfDay, MILL_PER_DAY } from '@util/time'
import { onMounted, Ref, ref, watch } from 'vue'

export type Activity = {
    date: string
    // offset of date (mills)
    start: number
    // mills
    duration: number
    // series
    seriesKey: string
    seriesName: string | undefined
}

type ActivityInner = Omit<Activity, 'date'>

export type MergeMethod = 'cate' | 'domain' | 'none'

const isMergeMethod = (val: unknown): val is MergeMethod => {
    return val === 'none' || val === 'domain' || val === 'cate'
}

const MONTH_DATE_FORMAT = t(msg => msg.calendar.monthDateFormat)
const formatDate = (date: Date | number) => formatTime(date, MONTH_DATE_FORMAT)

const calcOffsetOfDay = (ts: number) => {
    const startOfDate = getStartOfDay(ts)
    return ts - startOfDate.getTime()
}

const genLatestDates = () => {
    const now = new Date()
    const start = new Date(now.getTime() - MILL_PER_DAY * (TIMELINE_LIFE_CYCLE - 1))
    return getAllDatesBetween(start, now, formatDate)
}

async function mergeByDomain(ticks: timer.timeline.Tick[]): Promise<ActivityInner[]> {
    // 1. merge all
    const mergeRules = await mergeRuleDatabase.selectAll()
    const merger = new CustomizedHostMergeRuler(mergeRules)
    const allHosts = Array.from(new Set(ticks.map(t => t.host)))
    const mergedMap = toMap(allHosts, h => h, h => merger.merge(h))

    // 2. query all the merged sites' names
    const allSiteKeys = Array.from(new Set(Object.values(mergedMap)))
        .map((mergedHost) => ({ type: 'merged', host: mergedHost } satisfies timer.site.SiteKey))
    const allSites = await siteDatabase.getBatch(allSiteKeys)
    const nameMap = toMap(allSites, s => s.host, s => s.alias)

    // 3. convert
    return ticks.map(({ start, duration, host }) => {
        const seriesKey = mergedMap[host] ?? host
        return {
            start, duration,
            seriesKey, seriesName: nameMap[seriesKey],
        }
    })
}

async function mergeByCate(ticks: timer.timeline.Tick[], cateNameMap: Record<number, string>): Promise<ActivityInner[]> {
    // 1. query all the sites' category
    const allSiteKeys = Array.from(new Set(ticks.map(t => t.host)))
        .map(host => ({ type: 'normal', host } satisfies timer.site.SiteKey))
    const allSites = await siteDatabase.getBatch(allSiteKeys)
    const siteCateMap = toMap(allSites, s => s.host, s => s.cate)

    // 2. convert
    return ticks.map(({ start, duration, host }) => {
        const cateId = siteCateMap[host] ?? CATE_NOT_SET_ID
        return {
            start, duration,
            seriesKey: `${cateId}`,
            seriesName: cateNameMap[cateId],
        }
    })
}

async function fillSiteName(ticks: timer.timeline.Tick[]): Promise<ActivityInner[]> {
    // 1. query all the sites' names
    const allSiteKeys = Array.from(new Set(ticks.map(t => t.host)))
        .map(host => ({ type: 'normal', host } satisfies timer.site.SiteKey))
    const allSites = await siteDatabase.getBatch(allSiteKeys)
    const nameMap = toMap(allSites, s => s.host, s => s.alias)

    // 2. convert
    return ticks.map(({ start, duration, host }) => ({
        start, duration,
        seriesKey: host, seriesName: nameMap[host],
    }))
}

async function handleMerge(
    ticks: timer.timeline.Tick[],
    merge: MergeMethod,
    cateNameMap: Record<number, string>,
    dates: Set<string>
): Promise<Activity[]> {
    let activities: ActivityInner[] = []
    if (merge === 'domain') {
        activities = await mergeByDomain(ticks)
    } else if (merge === 'cate') {
        activities = await mergeByCate(ticks, cateNameMap)
    } else {
        activities = await fillSiteName(ticks)
    }
    const result: Activity[] = []
    activities.forEach(act => {
        let actStart = act.start
        const date = formatDate(actStart)
        if (!dates.has(date)) return

        const start = calcOffsetOfDay(act.start)
        result.push({ ...act, date, start })
    })
    return result
}

export const useMerge = (ticks: Ref<timer.timeline.Tick[]>) => {
    const dates = genLatestDates()
    const merge = ref<MergeMethod>('none')
    const { cateNameMap } = useCategories()
    const setMerge = (val: unknown) => isMergeMethod(val) && (merge.value = val)

    const [activities, setActivities] = useState<Activity[]>([])

    const refreshActivities = async () => {
        const newVal = await handleMerge(ticks.value, merge.value, cateNameMap.value, new Set(dates))
        setActivities(newVal)
    }

    watch([ticks, merge, cateNameMap], refreshActivities)

    onMounted(refreshActivities)

    return { merge, setMerge, activities, dates }
}