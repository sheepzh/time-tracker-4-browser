import { createStringUnionGuard } from 'typescript-guard'
import { computed } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'
import type { OptionCategory } from './types'

const isCategory = createStringUnionGuard<OptionCategory>('appearance', 'tracking', 'limit', 'accessibility', 'backup', 'notification')
const PARAM = "i"

function parseInit(query: LocationQuery): OptionCategory | undefined {
    const initialQuery = query[PARAM]
    const queryVal = Array.isArray(initialQuery) ? initialQuery[0] : initialQuery
    return isCategory(queryVal) ? queryVal : undefined
}

export const useCategory = () => {
    const route = useRoute()
    const router = useRouter()

    const category = computed({
        set(value: OptionCategory) {
            const oldQuery = route.query
            const query: LocationQuery = {
                ...oldQuery,
                [PARAM]: value,
            }
            router.replace({ query })
        },
        get: () => parseInit(route.query) ?? 'appearance',
    })

    const setCategory = (value: unknown) => isCategory(value) && (category.value = value)

    return { category, setCategory }
}