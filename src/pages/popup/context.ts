import { listAllCategories } from '@api/sw/cate'
import { getLimitSummary } from '@api/sw/limit'
import { getOption, setOption } from "@api/sw/option"
import { localReactive, localRef, useProvide, useProvider, useRequest } from "@hooks"
import { isDarkMode, processDarkMode } from "@pages/util/dark-mode"
import { toMap } from "@util/array"
import { CATE_NOT_SET_ID } from "@util/site"
import {
    createObjectGuard, createOptionalGuard, createStringUnionGuard, isBoolean, isNumber, isOptionalInt,
} from 'typescript-guard'
import { onBeforeMount, ref, watch, type ShallowRef } from "vue"
import { useRoute, useRouter } from 'vue-router'
import { t } from "./locale"
import { isMenu } from './router'
import type { PopupOption, PopupQuery } from './types'

type PopupContextValue = {
    reload: () => void
    darkMode: ShallowRef<boolean>
    setDarkMode: ArgCallback<boolean>
    query: PopupQuery
    option: PopupOption
    cateNameMap: ShallowRef<Record<number, string>>
    menu: ShallowRef<tt4b.ui.PopupMenu | undefined>
    limitSummary: ShallowRef<tt4b.limit.Summary | undefined>
    limitSummaryLoading: ShallowRef<boolean>
    selectedLimit: ShallowRef<number | undefined>
}

const initMenu = () => {
    const menu = localRef('popup_menu', isMenu, 'percentage')
    const route = useRoute()
    const router = useRouter()

    onBeforeMount(async () => {
        await router.isReady()
        const initial = route.path.substring(1)
        if (isMenu(initial)) {
            menu.value = initial
        } else {
            // Replace with valid menu
            router.replace(`/${menu.value}`)
        }
    })

    watch(menu, val => router.push(`/${val}`))

    return menu
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

    const query = localReactive('popup-query', isQuery, {
        dimension: 'focus',
        duration: 'today',
        mergeMethod: undefined,
    })
    const option = localReactive('popup-option', isOption, {
        showName: true,
        topN: 10,
        donutChart: false,
    })

    const menu = initMenu()

    const { data: limitSummary, loading: limitSummaryLoading } = useRequest(
        () => menu.value === 'limit' ? getLimitSummary() : Promise.resolve(undefined),
        {
            deps: menu,
            onSuccess(newVal) {
                const newItems = newVal?.items ?? []
                if (!newItems.some(i => i.id === selectedLimit.value)) {
                    selectedLimit.value = newItems[0]?.id
                }
            }
        },
    )
    const selectedLimit = ref<number>()

    useProvide<PopupContextValue>(NAMESPACE, {
        reload, darkMode, setDarkMode, query, option,
        cateNameMap,
        menu,
        limitSummary, limitSummaryLoading, selectedLimit,
    })

    return appKey
}

const isMergeMethod = createStringUnionGuard<Exclude<PopupQuery['mergeMethod'], undefined>>('cate', 'domain', 'group')

const isQuery = createObjectGuard<PopupQuery>({
    dimension: createStringUnionGuard<PopupQuery['dimension']>('focus', 'time'),
    duration: createStringUnionGuard<PopupQuery['duration']>('allTime', 'lastDays', 'thisMonth', 'thisWeek', 'today', 'yesterday'),
    durationNum: isOptionalInt,
    mergeMethod: createOptionalGuard(isMergeMethod),
})

const isOption = createObjectGuard<PopupOption>({
    showName: isBoolean,
    topN: isNumber,
    donutChart: isBoolean,
})

export const usePopupContext = () => useProvider<PopupContextValue, 'reload' | 'darkMode' | 'setDarkMode' | 'cateNameMap'>(
    NAMESPACE, 'reload', 'darkMode', 'setDarkMode', 'cateNameMap'
)

export const useQuery = () => useProvider<PopupContextValue, 'query'>(NAMESPACE, 'query').query

export const useOption = () => useProvider<PopupContextValue, 'option'>(NAMESPACE, 'option').option

export const useCateNameMap = () => useProvider<PopupContextValue, 'cateNameMap'>(NAMESPACE, 'cateNameMap')?.cateNameMap

export const useMenu = () => useProvider<PopupContextValue, 'menu'>(NAMESPACE, 'menu').menu

export const useLimitSummary = () => {
    const { limitSummary: summary, limitSummaryLoading: loading, selectedLimit: selected } = useProvider<PopupContextValue, 'limitSummary' | 'limitSummaryLoading' | 'selectedLimit'>(
        NAMESPACE, 'limitSummary', 'limitSummaryLoading', 'selectedLimit'
    )
    return { summary, loading, selected }
}