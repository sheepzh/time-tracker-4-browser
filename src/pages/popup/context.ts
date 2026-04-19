import { isDarkMode, processDarkMode } from "@/pages/util/dark-mode"
import { listAllCategories } from '@api/sw/cate'
import { getOption, setOption } from "@api/sw/option"
import { useLocalStorage, useProvide, useProvider, useRequest } from "@hooks"
import { toMap } from "@util/array"
import { CATE_NOT_SET_ID } from "@util/site"
import { reactive, ref, type ShallowRef, toRaw, watch } from "vue"
import { t } from "./locale"
import type { PopupOption, PopupQuery } from './types'

type PopupContextValue = {
    reload: () => void
    darkMode: ShallowRef<boolean>
    setDarkMode: (val: boolean) => void
    query: PopupQuery
    option: PopupOption
    cateNameMap: ShallowRef<Record<number, string>>
}

const NAMESPACE = '_'

export const initPopupContext = (): ShallowRef<number> => {
    const appKey = ref(Date.now())
    const reload = () => appKey.value = Date.now()

    const { data: darkMode, refresh: refreshDarkMode } = useRequest(async () => {
        const option = await getOption()
        return processDarkMode(option)
    }, { defaultValue: isDarkMode() })

    const setDarkMode = async (val: boolean) => {
        await setOption({ darkMode: val ? 'on' : 'off' })
        refreshDarkMode()
    }

    const { data: cateNameMap } = useRequest(async () => {
        const categories = await listAllCategories()
        const result = toMap(categories, c => c.id, c => c.name)
        result[CATE_NOT_SET_ID] = t(msg => msg.shared.cate.notSet)
        return result
    }, { defaultValue: {} })

    const query = initQuery()
    const option = initOption()
    useProvide<PopupContextValue>(NAMESPACE, { reload, darkMode, setDarkMode, query, option, cateNameMap })

    return appKey
}

const initQuery = () => {
    const [queryCache, setQueryCache] = useLocalStorage<PopupQuery>('popup-query', {
        dimension: 'focus',
        duration: 'today',
        mergeMethod: undefined,
    })

    const query = reactive(queryCache)
    watch(query, () => setQueryCache(toRaw(query)), { deep: true })

    return query
}

const initOption = () => {
    const [optionCache, setOptionCache] = useLocalStorage<PopupOption>('popup-option', {
        showName: true,
        topN: 10,
        donutChart: false,
    })

    const option = reactive(optionCache)
    watch(option, () => setOptionCache(toRaw(option)), { deep: true })

    return option
}

export const usePopupContext = () => useProvider<PopupContextValue, 'reload' | 'darkMode' | 'setDarkMode' | 'cateNameMap'>(
    NAMESPACE, 'reload', 'darkMode', 'setDarkMode', 'cateNameMap'
)

export const useQuery = () => useProvider<PopupContextValue, 'query'>(NAMESPACE, 'query').query

export const useOption = () => useProvider<PopupContextValue, 'option'>(NAMESPACE, 'option').option

export const useCateNameMap = () => useProvider<PopupContextValue, 'cateNameMap'>(NAMESPACE, 'cateNameMap')?.cateNameMap
