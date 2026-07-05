import { listAllCategories } from '@api/sw/cate'
import { getOption, setOption } from "@api/sw/option"
import { useProvide, useProvider, useRequest } from "@hooks"
import { isDarkMode, processDarkMode } from "@pages/util/dark-mode"
import { toMap } from "@util/array"
import { CATE_NOT_SET_ID } from "@util/site"
import type { Ref, ShallowRef } from "vue"
import { t } from "./locale"

type PopupContextValue = {
    darkMode: Readonly<Ref<boolean>>
    setDarkMode: ArgCallback<boolean>
    cateNameMap: Readonly<ShallowRef<Record<string, string>>>
}

const NAMESPACE = '_'

export const initPopupContext = () => {
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

    useProvide<PopupContextValue>(NAMESPACE, { darkMode, setDarkMode, cateNameMap })
}

export const useDarkMode = () => useProvider<PopupContextValue, 'darkMode' | 'setDarkMode'>(
    NAMESPACE, 'darkMode', 'setDarkMode'
)

export const useCateNameMap = () => useProvider<PopupContextValue, 'cateNameMap'>(NAMESPACE, 'cateNameMap').cateNameMap
