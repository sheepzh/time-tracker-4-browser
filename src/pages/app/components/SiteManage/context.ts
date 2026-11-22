import { isOptionalIntArray } from '@app/util/types'
import { localReactive, useProvide, useProvider } from '@hooks'
import { queryStr } from '@pages/util/route'
import { createObjectGuard } from 'typescript-guard'
import { type Ref, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { DisplayComponent, ModifyInstance } from './types'

type FilterOption = {
    host?: string
    query?: string
    types?: tt4b.site.Type[]
    cateIds?: number[]
}

type CacheValue = Pick<FilterOption, 'cateIds'>
const isCacheValue = createObjectGuard<CacheValue>({ cateIds: isOptionalIntArray })

type Context = {
    filter: FilterOption
    modifyInst: Ref<ModifyInstance | undefined>
    comp: Ref<DisplayComponent | undefined>
}

const NAMESPACE = 'site-manage'

export const initSiteManage = () => {
    const { host } = useRoute().query
    const filter = localReactive<FilterOption, keyof CacheValue>('site-manage-filter',
        isCacheValue, { cateIds: undefined }, { host: queryStr(host) }
    )
    const modifyInst = ref<ModifyInstance>()
    const comp = ref<DisplayComponent>()

    useProvide<Context>(NAMESPACE, { filter, modifyInst, comp })

    return { comp, modifyInst }
}

export const useSiteManage = () => useProvider<Context, 'filter' | 'modifyInst' | 'comp'>(NAMESPACE, 'filter', 'modifyInst', 'comp')