import { getSitePage } from '@api/sw/site'
import { isOptionalIntArray } from '@app/util/limit/types'
import { localReactive, useProvide, useProvider, useRequest } from '@hooks'
import { createObjectGuard } from 'typescript-guard'
import { reactive, Ref, ref, type ShallowRef, toRefs } from 'vue'
import type { ModifyInstance } from './Modify'

type FilterOption = {
    query?: string
    types?: tt4b.site.Type[]
    cateIds?: number[]
}

type CacheValue = {
    cateIds?: number[]
}

const isCacheValue = createObjectGuard<CacheValue>({
    cateIds: isOptionalIntArray,
})

type Context = {
    pagination: ShallowRef<tt4b.common.PageResult<tt4b.site.SiteInfo>>
    filter: FilterOption
    selected: ShallowRef<tt4b.site.SiteInfo[]>
    refresh: NoArgCallback
    modifyInst: Ref<ModifyInstance | undefined>
}

const NAMESPACE = 'site-manage'

const initData = () => {
    const cached = localReactive<CacheValue>('site-manage-filter', isCacheValue, { cateIds: undefined })
    const filter: FilterOption = reactive({ ...toRefs(cached) })

    const page = reactive<tt4b.common.PageQuery>({ num: 1, size: 20 })

    const loadingTarget = ref<HTMLElement>()
    const { data: pagination, refresh, loading } = useRequest(() => {
        const { query: fuzzyQuery, cateIds, types } = filter
        return getSitePage({ fuzzyQuery, cateIds, types }, page)
    }, {
        defaultValue: { list: [], total: 0 },
        loadingTarget,
        deps: [() => filter, () => page],
    })
    return { pagination, refresh, loading, loadingTarget, filter, page }
}

export const initSiteManage = () => {
    const {
        pagination, refresh, loading, loadingTarget, filter, page
    } = initData()

    const selected = ref<tt4b.site.SiteInfo[]>([])
    const modifyInst = ref<ModifyInstance>()

    useProvide<Context>(NAMESPACE, { pagination, filter, selected, refresh, modifyInst })

    return {
        pagination, refresh, loading, modifyInst,
        page, loadingTarget,
    }
}

export const useSiteManageFilter = () => useProvider<Context, 'filter' | 'modifyInst'>(NAMESPACE, 'filter', 'modifyInst')

export const useSiteManageTable = () => useProvider<Context, 'pagination' | 'refresh' | 'selected'>(NAMESPACE, 'pagination', 'refresh', 'selected')