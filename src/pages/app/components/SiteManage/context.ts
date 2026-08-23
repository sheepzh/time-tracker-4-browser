import { isOptionalIntArray } from '@app/util/types'
import { localReactive, useProvide, useProvider } from '@hooks'
import { createObjectGuard } from 'typescript-guard'
import { reactive, Ref, ref, toRefs } from 'vue'
import { useRoute } from 'vue-router'
import type { DisplayComponent, ModifyInstance } from './types'

type FilterOption = {
    host?: string
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
    filter: FilterOption
    modifyInst: Ref<ModifyInstance | undefined>
    comp: Ref<DisplayComponent | undefined>
}

const NAMESPACE = 'site-manage'


export const initSiteManage = () => {
    const cached = localReactive<CacheValue>('site-manage-filter', isCacheValue, { cateIds: undefined })
    const route = useRoute()
    const hostQuery = route.query.host
    const host = Array.isArray(hostQuery) ? hostQuery[0] : hostQuery
    const filter: FilterOption = reactive({ ...toRefs(cached), host: host ?? undefined })
    const modifyInst = ref<ModifyInstance>()
    const comp = ref<DisplayComponent>()

    useProvide<Context>(NAMESPACE, { filter, modifyInst, comp })

    return { comp, modifyInst }
}

export const useSiteManage = () => useProvider<Context, 'filter' | 'modifyInst' | 'comp'>(NAMESPACE, 'filter', 'modifyInst', 'comp')