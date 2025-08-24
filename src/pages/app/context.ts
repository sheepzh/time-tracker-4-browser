import { useProvide, useProvider, useRequest } from "@hooks"
import cateService from "@service/cate-service"
import { toMap } from '@util/array'
import { CATE_NOT_SET_ID } from '@util/site'
import { computed, type Ref } from "vue"
import { t } from './locale'

type AppContextValue = {
    categories: Ref<timer.site.Cate[]>
    refreshCategories: () => void
    cateNameMap: Ref<Record<number, string>>
}

const NAMESPACE = '_'

export const initAppContext = () => {
    const { data: categories, refresh: refreshCategories } = useRequest(() => cateService.listAll(), { defaultValue: [] })
    const cateNameMap = computed(() => {
        const map = toMap(categories.value, c => c.id, c => c.name)
        map[CATE_NOT_SET_ID] = t(msg => msg.shared.cate.notSet)
        return map
    })
    useProvide<AppContextValue>(NAMESPACE, { categories, refreshCategories, cateNameMap })
}

export const useCategories = () => useProvider<AppContextValue, "categories" | "refreshCategories" | "cateNameMap">(
    NAMESPACE, "categories", "refreshCategories", "cateNameMap"
)
