import { RequestOption, useLocalStorage, useProvide, useProvider, useRequest, useState } from '@hooks'
import siteService, { type SiteQueryParam } from '@service/site-service'
import { type Reactive, reactive, type ShallowRef, watch } from 'vue'

type FilterOption = {
    query?: string
    types?: timer.site.Type[]
    cateIds?: number[]
}

type CacheValue = {
    cateIds?: number[]
}

type Context = {
    pagination: ShallowRef<timer.common.PageResult<timer.site.SiteInfo> | undefined>
    filter: Reactive<FilterOption>
    selected: ShallowRef<timer.site.SiteInfo[]>
    setSelected: ArgCallback<timer.site.SiteInfo[]>
    refresh: NoArgCallback
}

const NAMESPACE = 'site-manage'

export const initSiteManage = (loadingTarget: RequestOption<unknown, unknown[]>['loadingTarget']) => {
    const [cache, setCache] = useLocalStorage<CacheValue>('site-manage-filter')

    const filter = reactive<FilterOption>({ cateIds: cache?.cateIds })
    watch(() => filter.cateIds, cateIds => setCache({ cateIds }))

    const page = reactive<timer.common.PageQuery>({ num: 1, size: 20 })
    const [selected, setSelected] = useState<timer.site.SiteInfo[]>([])

    const { data: pagination, refresh, loading } = useRequest(() => {
        const { query: fuzzyQuery, cateIds, types } = filter
        const param: SiteQueryParam = { fuzzyQuery, cateIds, types }
        return siteService.selectByPage(param, page)
    }, { loadingTarget, deps: [() => filter, () => page] })

    useProvide<Context>(NAMESPACE, { pagination, filter, selected, setSelected, refresh })

    return {
        pagination, refresh, loading,
        selected, page,
    }
}

export const useSiteManageFilter = () => useProvider<Context, 'filter'>(NAMESPACE, 'filter').filter

export const useSiteManageTable = () => useProvider<Context, 'pagination' | 'refresh' | 'setSelected'>(NAMESPACE, 'pagination', 'refresh', 'setSelected')