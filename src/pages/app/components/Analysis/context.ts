/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useLocalStorage, useProvide, useProvider, useRequest } from "@hooks"
import { selectCate, selectSite } from "@service/stat-service"
import { ref, watch, type Ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import type { AnalysisTarget } from "./types"

type Context = {
    target: Ref<AnalysisTarget | undefined>
    timeFormat: Ref<timer.app.TimeFormat>
    rows: Ref<timer.stat.Row[]>
}

export type AnalysisQuery = Partial<timer.site.SiteKey> & {
    cateId?: string
}

function parseQuery(): AnalysisTarget | undefined {
    // Process the query param
    const query = useRoute().query as unknown as AnalysisQuery
    useRouter().replace({ query: {} })
    const { host, type: siteType, cateId } = query
    if (cateId) return { type: 'cate', key: parseInt(cateId) }
    if (host && siteType) return { type: 'site', key: { host, type: siteType } }
    return undefined
}

async function queryRows(target: AnalysisTarget | undefined): Promise<(timer.stat.CateRow | timer.stat.SiteRow)[]> {
    const { key, type } = target ?? {}
    if (!key) return []

    if (type === 'cate') {
        return selectCate({ cateIds: [key], sortKey: 'date' })
    } else if (type === 'site') {
        const { host, type: siteType } = key ?? {}
        return selectSite({ host, mergeHost: siteType === 'merged', sortKey: 'date' })
    } else {
        // Not supported yet
        return []
    }
}

const NAMESPACE = 'siteAnalysis'

export const initAnalysis = () => {
    const target = ref(parseQuery())

    const [cachedFormat, setFormatCache] = useLocalStorage<timer.app.TimeFormat>('analysis_timeFormat')
    const timeFormat = ref(cachedFormat ?? 'default')
    watch(timeFormat, setFormatCache)

    const { data: rows, loading } = useRequest(() => queryRows(target.value), { deps: target, defaultValue: [] })
    useProvide<Context>(NAMESPACE, { target, timeFormat, rows })

    return { loading }
}

export const useAnalysisTarget = () => useProvider<Context, 'target'>(NAMESPACE, "target").target

export const useAnalysisTimeFormat = () => useProvider<Context, 'timeFormat'>(NAMESPACE, "timeFormat").timeFormat

export const useAnalysisRows = () => useProvider<Context, 'rows'>(NAMESPACE, "rows").rows