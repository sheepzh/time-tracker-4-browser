import { listCates } from "@api/sw/cate"
import { getOption, setDarkMode as setOptionDarkMode } from "@api/sw/option"
import { useLocalStorage, useProvide, useProvider, useRequest } from "@hooks"
import { toMap } from "@util/array"
import { isDarkMode, processDarkMode } from "@util/dark-mode"
import { CATE_NOT_SET_ID } from "@util/site"
import { reactive, type Reactive, ref, type Ref, toRaw, watch } from "vue"
import { t } from "./locale"

export type PopupDuration =
    | "today" | "yesterday" | "thisWeek" | "thisMonth"
    | "lastDays"
    | "allTime"

export type PopupQuery = {
    mergeMethod: Exclude<timer.stat.MergeMethod, 'date'> | undefined
    duration: PopupDuration
    durationNum?: number
    dimension: Exclude<timer.core.Dimension, 'run'>
}

export type PopupOption = {
    showName: boolean
    topN: number
    donutChart: boolean
}

type PopupContextValue = {
    reload: () => void
    darkMode: Ref<boolean>
    setDarkMode: (val: boolean) => void
    query: Reactive<PopupQuery>
    option: Reactive<PopupOption>
    cateNameMap: Ref<Record<number, string>>
}

const NAMESPACE = '_'

export const initPopupContext = (): Ref<number> => {
    const appKey = ref(Date.now())
    const reload = () => appKey.value = Date.now()

    const { data: darkMode, refresh: refreshDarkMode } = useRequest(async () => {
        const option = await getOption()
        return processDarkMode(option)
    }, { defaultValue: isDarkMode() })

    const setDarkMode = async (val: boolean) => {
        const option: timer.option.DarkMode = val ? 'on' : 'off'
        await setOptionDarkMode(option)
        refreshDarkMode()
    }

    const { data: cateNameMap } = useRequest(async () => {
        const categories = await listCates()
        const result = toMap(categories ?? [], c => c.id, c => c.name)
        result[CATE_NOT_SET_ID] = t(msg => msg.shared.cate.notSet)
        return result
    }, { defaultValue: {} })

    const query = initQuery()
    const option = initOption()
    useProvide<PopupContextValue>(NAMESPACE, { reload, darkMode: darkMode as Ref<boolean>, setDarkMode, query, option, cateNameMap })

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