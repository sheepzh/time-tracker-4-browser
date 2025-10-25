import { MediaSize, useMediaSize, useProvide, useProvider, useRequest } from "@hooks"
import cateService from "@service/cate-service"
import { toMap } from '@util/array'
import { CATE_NOT_SET_ID } from '@util/site'
import { computed, reactive, watch, type Ref } from "vue"
import { t } from './locale'

type MenuLayout = 'nav' | 'sidebar'

interface CategoryInstance {
    enabled: boolean
    all: timer.site.Cate[]
    nameMap: Record<number, string>
    refresh(): void
}

type AppContextValue = {
    category: Readonly<CategoryInstance>
    layout: Readonly<Ref<MenuLayout>>
}

const NAMESPACE = '_'

export const initAppContext = () => {
    const { refresh: refreshCategories } = useRequest(() => cateService.listAll(), {
        onSuccess: categories => {
            category.all = categories
            const map = toMap(categories, c => c.id, c => c.name)
            map[CATE_NOT_SET_ID] = t(msg => msg.shared.cate.notSet)
            category.nameMap = map
        }
    })
    const mediaSize = useMediaSize()
    const layout = computed<MenuLayout>(() => mediaSize.value > MediaSize.sm ? 'sidebar' : 'nav')
    watch(layout, v => category.enabled = v === 'sidebar')
    const category: CategoryInstance = reactive({
        enabled: layout.value === 'sidebar',
        all: [],
        nameMap: {},
        refresh: refreshCategories,
    })
    useProvide<AppContextValue>(NAMESPACE, { category, layout })

    return { layout }
}

export const useCategory = () => useProvider<AppContextValue, "category">(NAMESPACE, "category").category

export const useLayout = () => useProvider<AppContextValue, "layout">(NAMESPACE, "layout").layout