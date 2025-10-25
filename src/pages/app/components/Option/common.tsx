/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey } from "@app/locale"
import { type Router, useRoute } from "vue-router"

export const ALL_CATEGORIES = ["appearance", "statistics", 'dailyLimit', 'accessibility', 'backup'] as const
export type OptionCategory = typeof ALL_CATEGORIES[number]

export type OptionInstance = {
    reset: () => Promise<void> | void
}

const PARAM = "i"

export function parseQuery(): OptionCategory | undefined {
    const initialQuery = useRoute().query?.[PARAM]
    const queryVal: string | null | undefined = Array.isArray(initialQuery) ? initialQuery[0] : initialQuery
    if (!queryVal) return undefined
    const cate = queryVal as OptionCategory
    return ALL_CATEGORIES.includes(cate) ? cate : undefined
}

export function changeQuery(cate: OptionCategory, router: Router) {
    const query: Record<string, string> = {}
    query[PARAM] = cate
    router.replace({ query })
}

export const CATE_LABELS: Record<OptionCategory, I18nKey> = {
    appearance: msg => msg.option.appearance.title,
    statistics: msg => msg.option.statistics.title,
    dailyLimit: msg => msg.menu.limit,
    accessibility: msg => msg.option.accessibility.title,
    backup: msg => msg.option.backup.title,
}