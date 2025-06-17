import { useLocalStorage, useProvide, useProvider } from "@hooks"
import { reactive, type Reactive, ref, type Ref, toRaw, watch } from "vue"
import { type RouteLocation, type Router, useRoute, useRouter } from "vue-router"
import type { DisplayComponent, ReportFilterOption, ReportQueryParam, ReportSort } from "./types"

type Context = {
    filter: Reactive<ReportFilterOption>
    sort: Ref<ReportSort>
    comp: Ref<DisplayComponent | undefined>
}

const NAMESPACE = 'report'

type QueryPartial = PartialPick<ReportFilterOption, 'query' | 'dateRange' | 'mergeDate' | 'siteMerge'>

/**
 * Init the query parameters
 */
function parseQuery(route: RouteLocation, router: Router): [QueryPartial, ReportSort['prop'] | undefined] {
    const routeQuery = route.query as unknown as ReportQueryParam
    const { q, mm, md, ds, de, sc } = routeQuery
    const dateStart = ds ? new Date(Number.parseInt(ds)) : undefined
    const dateEnd = de ? new Date(Number.parseInt(de)) : undefined
    // Remove queries
    router.replace({ query: {} })

    const now = new Date()
    const partial: QueryPartial = {
        ...(q && { query: q }),
        ...((md === 'true' || md === '1') && { mergeDate: true }),
        ...((dateStart ?? dateEnd) && { dateRange: [dateStart ?? now, dateEnd ?? now] }),
        ...(mm && { siteMerge: mm })
    }
    return [partial, sc ? sc satisfies ReportSort['prop'] : undefined]
}

type FilterStorageValue = Omit<ReportFilterOption, 'dateRange' | 'readRemote'> & {
    dateStart?: number
    dateEnd?: number
}

const cvtStorage2Filter = (storage: FilterStorageValue | undefined): ReportFilterOption => {
    const { query, dateStart, dateEnd, mergeDate, siteMerge, cateIds, timeFormat } = storage || {}
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

const cvtFilter2Storage = (filter: ReportFilterOption): FilterStorageValue => {
    const { query, dateRange, mergeDate, siteMerge, cateIds, timeFormat } = filter
    return {
        query,
        mergeDate, siteMerge,
        dateStart: dateRange?.[0]?.getTime?.(),
        dateEnd: dateRange?.[1]?.getTime?.(),
        cateIds, timeFormat,
    }
}

export const initReportContext = () => {
    const route = useRoute()
    const router = useRouter()
    const [queryFilter, querySort] = parseQuery(route, router)

    const [cachedFilter, setCachedFilter] = useLocalStorage<FilterStorageValue>('report_filter')

    const initialFilter: ReportFilterOption = { ...cvtStorage2Filter(cachedFilter), ...queryFilter }
    const filter = reactive(initialFilter)
    watch(() => filter, v => setCachedFilter(cvtFilter2Storage(toRaw(v))), { deep: true })

    const sort = ref<ReportSort>({
        order: 'descending',
        prop: querySort || 'focus'
    })

    const comp = ref<DisplayComponent>()

    const context: Context = { filter, sort, comp }
    useProvide<Context>(NAMESPACE, context)

    return context
}

export const useReportFilter = (): Reactive<ReportFilterOption> => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter

export const useReportSort = (): Ref<ReportSort> => useProvider<Context, 'sort'>(NAMESPACE, 'sort').sort

export const useReportComponent = () => useProvider<Context, 'comp'>(NAMESPACE, 'comp').comp