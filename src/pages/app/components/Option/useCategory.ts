import { queryStr } from '@pages/util/route'
import { createStringUnionGuard } from 'typescript-guard'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { OptionCategory } from './types'

const isCategory = createStringUnionGuard<OptionCategory>('appearance', 'tracking', 'limit', 'accessibility', 'backup', 'notification')
const PARAM = "i"

export const useCategory = () => {
    const route = useRoute()
    const router = useRouter()

    const category = computed<OptionCategory>({
        set: val => router.replace({ query: { ...route.query, [PARAM]: val } }),
        get: () => {
            const query = queryStr(route.query[PARAM])
            return isCategory(query) ? query : 'appearance'
        },
    })

    const setCategory = (value: unknown) => isCategory(value) && (category.value = value)

    return { category, setCategory }
}