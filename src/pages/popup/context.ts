import { listAllCategories } from '@api/sw/cate'
import { getOption, setOption } from "@api/sw/option"
import { localRef, useProvide, useProvider, useRequest } from "@hooks"
import { isDarkMode, processDarkMode } from "@pages/util/dark-mode"
import { toMap } from "@util/array"
import { CATE_NOT_SET_ID } from "@util/site"
import { createStringUnionGuard } from 'typescript-guard'
import { onBeforeMount, ref, watch, type ShallowRef } from "vue"
import { useRoute, useRouter } from 'vue-router'
import { t } from "./locale"

type PopupContextValue = {
    reload: NoArgCallback
    darkMode: ShallowRef<boolean>
    setDarkMode: ArgCallback<boolean>
    cateNameMap: ShallowRef<Record<number, string>>
    menu: ShallowRef<tt4b.ui.PopupMenu | undefined>
}

export const isMenu = createStringUnionGuard<tt4b.ui.PopupMenu>('limit', 'percentage', 'ranking', 'focus')

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

    const menu = initMenu()

    useProvide<PopupContextValue>(NAMESPACE, { reload, darkMode, setDarkMode, cateNameMap, menu })

    return appKey
}

export const usePopupContext = () => useProvider<PopupContextValue, 'reload' | 'darkMode' | 'setDarkMode'>(
    NAMESPACE, 'reload', 'darkMode', 'setDarkMode'
)

export const useCateNameMap = () => useProvider<PopupContextValue, 'cateNameMap'>(NAMESPACE, 'cateNameMap').cateNameMap

export const useMenu = () => useProvider<PopupContextValue, 'menu'>(NAMESPACE, 'menu').menu
