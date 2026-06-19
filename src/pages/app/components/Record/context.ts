import type { RecordQuery } from '@app/router/constants'
import { isOptionalIntArray, isTimeFormat } from '@app/util/limit/types'
import { localReactive, useProvide, useProvider } from '@hooks'
import { getBirthday } from "@util/time"
import {
    createObjectGuard, createOptionalGuard, createStringUnionGuard, isBoolean, isOptionalString,
} from 'typescript-guard'
import { reactive, ref, type ShallowRef, toRefs } from "vue"
import { useRoute, useRouter } from "vue-router"
import type { DisplayComponent, RecordFilterOption, RecordSort } from "./types"

type Context = {
    filter: RecordFilterOption
    sort: ShallowRef<RecordSort>
    comp: ShallowRef<DisplayComponent | undefined>
}

const NAMESPACE = 'record'

const isSortProp = createStringUnionGuard<RecordSort['prop']>('date', 'host', 'focus', 'run', 'time')
const isSiteMerge = createStringUnionGuard<Exclude<RecordFilterOption['siteMerge'], undefined>>(
    'cate', 'domain', 'group',
)

/**
 * Init the query parameters
 */
function initQuery(filter: RecordFilterOption): RecordSort['prop'] | undefined {
    const route = useRoute()
    const router = useRouter()
    const { q, md, ds, de, mm, sc } = route.query as RecordQuery
    // Remove queries
    router.replace({ query: {} })

    // Query
    const query = q?.trim()
    if (query) filter.query = query
    // Date range
    let dateStart = ds ? Number.parseInt(ds) : undefined
    if (Number.isNaN(dateStart)) dateStart = undefined
    let dateEnd = de ? Number.parseInt(de) : undefined
    if (Number.isNaN(dateEnd)) dateEnd = undefined
    if (dateStart || dateEnd) {
        filter.dateRange = [dateStart ?? getBirthday().getTime(), dateEnd ?? Date.now()]
    }
    // Merge method
    if (md === 'true' || md === '1') filter.mergeDate = true
    if (isSiteMerge(mm)) filter.siteMerge = mm

    return isSortProp(sc) ? sc : undefined
}

type CacheValue = Omit<RecordFilterOption, 'dateRange' | 'readRemote'>

const isCacheValue = createObjectGuard<CacheValue>({
    query: isOptionalString,
    mergeDate: isBoolean,
    siteMerge: createOptionalGuard(isSiteMerge),
    cateIds: isOptionalIntArray,
    timeFormat: isTimeFormat,
})

export const initRecordContext = () => {
    const cached = localReactive('record_filter', isCacheValue, {
        query: undefined,
        mergeDate: false,
        timeFormat: 'default',
    })
    const filter: RecordFilterOption = reactive({
        ...toRefs(cached),
        readRemote: false,
        dateRange: [Date.now(), Date.now()],
    })
    const querySort = initQuery(filter)

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