import { listCateStats, listGroupStats, listSiteStats } from '@api/sw/stat'
import type { RecordQuery } from '@app/router/constants'
import { isOptionalIntArray, isTimeFormat } from '@app/util/types'
import { localReactive, useManualRequest, useProvide, useProvider, useRemoteValue } from '@hooks'
import { queryInt, queryStr, type MakeRouteQuery } from '@pages/util/route'
import { BIRTHDAY, cvtDateRange2Str, fmtDur } from '@pages/util/time'
import { sum } from '@util/array'
import { truthy } from '@util/lang'
import {
    createObjectGuard, createOptionalGuard, createStringUnionGuard, isBoolean, isOptionalString,
} from 'typescript-guard'
import { ref, type ShallowRef, type WatchSource } from "vue"
import { useRoute, useRouter } from "vue-router"
import type { DisplayComponent, RecordFilterOption, RecordSort } from "./types"

type Context = {
    filter: RecordFilterOption
    sort: ShallowRef<RecordSort>
    comp: ShallowRef<DisplayComponent | undefined>
}

const NAMESPACE = 'record'

const isSortProp = createStringUnionGuard<RecordSort['prop']>('date', 'host', 'focus', 'time')
const isSiteMerge = createStringUnionGuard<Exclude<RecordFilterOption['siteMerge'], undefined>>(
    'cate', 'domain', 'group',
)

/**
 * Init the query parameters
 */
function initQuery(filter: RecordFilterOption): RecordSort['prop'] | undefined {
    const route = useRoute()
    const router = useRouter()
    const { q, md, ds, de, mm, sc }: MakeRouteQuery<RecordQuery> = route.query
    // Remove queries
    router.replace({ query: {} })

    // Query
    q && (filter.query = queryStr(q))
    // Date range
    const dateStart = queryInt(ds)
    const dateEnd = queryInt(de)
    if (dateStart !== undefined || dateEnd !== undefined) {
        filter.dateRange = [dateStart ?? BIRTHDAY.getTime(), dateEnd ?? Date.now()]
    }
    // Merge method
    if (md && ['true', '1'].includes(queryStr(md))) filter.mergeDate = true
    if (isSiteMerge(mm)) filter.siteMerge = mm

    return isSortProp(sc) ? sc : undefined
}

type CacheValue = Omit<RecordFilterOption, 'dateRange' | 'timeRange' | 'focusRange'>

const isCacheValue = createObjectGuard<CacheValue>({
    query: isOptionalString,
    mergeDate: isBoolean,
    siteMerge: createOptionalGuard(isSiteMerge),
    cateIds: isOptionalIntArray,
    timeFormat: isTimeFormat,
})

export const initRecordContext = () => {
    const filter = localReactive<RecordFilterOption, keyof CacheValue>('record_filter', isCacheValue, {
        query: undefined,
        mergeDate: false,
        timeFormat: 'default',
        siteMerge: undefined,
        cateIds: undefined,
    }, { dateRange: [Date.now(), Date.now()] })
    const querySort = initQuery(filter)
    const sort = ref<RecordSort>({ order: 'descending', prop: querySort ?? 'focus' })
    const comp = ref<DisplayComponent>()

    const context: Context = { filter, sort, comp }
    useProvide<Context>(NAMESPACE, context)

    return context
}

export const useRecordFilter = (): RecordFilterOption => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter

export const useRecordSort = (): ShallowRef<RecordSort> => useProvider<Context, 'sort'>(NAMESPACE, 'sort').sort

export const useRecordComponent = () => useProvider<Context, 'comp'>(NAMESPACE, 'comp').comp

export const useSummary = (watchFilter?: boolean) => {
    const filter = useRecordFilter()
    const remote = useRemoteValue()
    const { data, refresh, loading } = useManualRequest(async () => {
        const { siteMerge, dateRange, query, cateIds } = filter
        const date = cvtDateRange2Str(dateRange)
        let rows: tt4b.stat.Row[] = []
        if (siteMerge === 'group') {
            rows = await listGroupStats({ date, query })
        } else if (siteMerge === 'cate') {
            rows = await listCateStats({ date, query, cateIds, remote: remote.value })
        } else {
            const mergeHost = siteMerge === 'domain'
            rows = await listSiteStats({ date, query, cateIds, remote: remote.value, mergeHost })
        }
        const visit = sum(rows.map(e => e.time))
        const focus = sum(rows.map(e => e.focus))
        return { visit, focus: fmtDur(focus, { format: filter.timeFormat }) }
    }, {
        defaultValue: { visit: 0, focus: '0s' },
        deps: truthy<WatchSource>(remote, watchFilter && (() => ({ ...filter }))),
    })
    return { data, refresh, loading }
}