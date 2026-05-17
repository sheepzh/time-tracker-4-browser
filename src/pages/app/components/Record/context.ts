import { useLocalStorage, useProvide, useProvider } from '@hooks'
import { createStringUnionGuard, isString } from 'typescript-guard'
import { reactive, ref, type ShallowRef, toRaw, watch } from "vue"
import { type RouteLocation, type Router, useRoute, useRouter } from "vue-router"
import type { DisplayComponent, RecordFilterOption, RecordSort } from "./types"

type Context = {
    filter: RecordFilterOption
    sort: ShallowRef<RecordSort>
    comp: ShallowRef<DisplayComponent | undefined>
}

const NAMESPACE = 'record'

type QueryPartial = PartialPick<RecordFilterOption, 'query' | 'dateRange' | 'mergeDate' | 'siteMerge'>

const isSortProp = createStringUnionGuard<RecordSort['prop']>('date', 'host', 'focus', 'run', 'time')
const isSiteMerge = createStringUnionGuard<Exclude<RecordFilterOption['siteMerge'], undefined>>(
    'cate', 'domain', 'group',
)

/**
 * Init the query parameters
 */
function parseQuery(route: RouteLocation, router: Router): [QueryPartial, RecordSort['prop'] | undefined] {
    const routeQuery = route.query
    const { q, mm, md, ds, de, sc } = routeQuery
    const dateStart = isString(ds) ? new Date(Number.parseInt(ds)) : undefined
    const dateEnd = isString(de) ? new Date(Number.parseInt(de)) : undefined
    // Remove queries
    router.replace({ query: {} })

    const now = new Date()
    const partial: QueryPartial = {
        ...(isString(q) && { query: q }),
        ...((md === 'true' || md === '1') && { mergeDate: true }),
        ...((dateStart ?? dateEnd) && { dateRange: [dateStart ?? now, dateEnd ?? now] }),
        ...(isSiteMerge(mm) && { siteMerge: mm })
    }
    return [partial, isSortProp(sc) ? sc : undefined]
}

type FilterStorageValue = Omit<RecordFilterOption, 'dateRange' | 'readRemote'> & {
    dateStart?: number
    dateEnd?: number
}

const cvtStorage2Filter = (storage: FilterStorageValue | undefined): RecordFilterOption => {
    const { query, dateStart, dateEnd, mergeDate, siteMerge, cateIds, timeFormat } = storage ?? {}
    const now = new Date()
    return {
        query,
        dateRange: [dateStart ? new Date(dateStart) : now, dateEnd ? new Date(dateEnd) : now],
        mergeDate: mergeDate ?? false,
        siteMerge,
        cateIds,
        timeFormat: timeFormat ?? 'default',
        readRemote: false,
    }
}

const cvtFilter2Storage = (filter: RecordFilterOption): FilterStorageValue => {
    const { query, dateRange, mergeDate, siteMerge, cateIds, timeFormat } = filter
    const [dateStart, dateEnd] = dateRange instanceof Date ? [dateRange,] : dateRange ?? []
    return {
        query,
        mergeDate, siteMerge,
        dateStart: dateStart?.getTime?.(),
        dateEnd: dateEnd?.getTime?.(),
        cateIds, timeFormat,
    }
}

export const initRecordContext = () => {
    const route = useRoute()
    const router = useRouter()
    const [queryFilter, querySort] = parseQuery(route, router)

    const [cachedFilter, setCachedFilter] = useLocalStorage<FilterStorageValue>('record_filter')
    const filter = reactive<RecordFilterOption>({ ...cvtStorage2Filter(cachedFilter), ...queryFilter })
    watch(() => filter, v => setCachedFilter(cvtFilter2Storage(toRaw(v))), { deep: true })

    const sort = ref<RecordSort>({
        order: 'descending',
        prop: querySort ?? 'focus'
    })

    const comp = ref<DisplayComponent>()

    const context: Context = { filter, sort, comp }
    useProvide<Context>(NAMESPACE, context)

    return context
}

export const useRecordFilter = (): RecordFilterOption => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter

export const useRecordSort = (): ShallowRef<RecordSort> => useProvider<Context, 'sort'>(NAMESPACE, 'sort').sort

export const useRecordComponent = () => useProvider<Context, 'comp'>(NAMESPACE, 'comp').comp