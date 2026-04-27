import { t, type I18nKey } from '@app/locale'
import { createStringUnionGuard } from 'typescript-guard'
import { computed, type ShallowRef } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

export type OptionCategory = 'appearance' | 'tracking' | 'limit' | 'accessibility' | 'backup' | 'notification'
const isCategory = createStringUnionGuard<OptionCategory>('appearance', 'tracking', 'limit', 'accessibility', 'backup', 'notification')

const CATE_LABELS: Record<OptionCategory, I18nKey> = {
    appearance: msg => msg.option.appearance.title,
    tracking: msg => msg.option.tracking.title,
    limit: msg => msg.base.limit,
    accessibility: msg => msg.option.accessibility.title,
    backup: msg => msg.option.backup.title,
    notification: msg => msg.option.notification.title,
}

const PARAM = "i"

function parseInit(query: LocationQuery): OptionCategory | undefined {
    const initialQuery = query[PARAM]
    const queryVal = Array.isArray(initialQuery) ? initialQuery[0] : initialQuery
    return isCategory(queryVal) ? queryVal : undefined
}

export const useCategory = (): {
    category: ShallowRef<OptionCategory>
    setCategory: (value: unknown) => void
    getLabel: (cate: unknown) => string | undefined
} => {
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
    const getLabel = (cate: unknown) => {
        const key = isCategory(cate) ? CATE_LABELS[cate] : undefined
        return key ? t(key) : undefined
    }

    return { category, setCategory, getLabel }
}