/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type AppSiteAnalysisQuery } from '@/shared/route'
import { listCateStats, listSiteStats } from "@api/sw/stat"
import { isTimeFormat } from '@app/util/types'
import { localRef, useProvide, useProvider, useRemoteValue, useRequest } from "@hooks"
import { extractHostname } from '@util/pattern'
import { ref, type Ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import type { AnalysisTarget } from "./types"

type Context = {
    target: Ref<AnalysisTarget | undefined>
    timeFormat: Ref<tt4b.ui.TimeFormat>
    rows: Ref<tt4b.stat.Row[] | undefined>
}

function parseQuery(): AnalysisTarget | undefined {
    // Process the query param
    const query = useRoute().query as unknown as AppSiteAnalysisQuery
    useRouter().replace({ query: {} })
    const { host, type: siteType, cateId, url } = query
    if (cateId) return { type: 'cate', key: parseInt(cateId) }
    if (host && siteType) return { type: 'site', key: { host, type: siteType } }
    if (url) return { type: 'site', key: { host: extractHostname(url).host, type: 'normal' } }
    return undefined
}

async function queryRows({ key, type }: AnalysisTarget, remote: boolean): Promise<(tt4b.stat.CateRow | tt4b.stat.SiteRow)[]> {
    if (type === 'cate') {
        return await listCateStats({ cateIds: [key], sortKey: 'date', remote })
    } else if (type === 'site') {
        const { host, type: siteType } = key
        return await listSiteStats({ host, mergeHost: siteType === 'merged', sortKey: 'date', remote })
    } else {
        // Not supported yet
        return []
    }
}

const NAMESPACE = 'siteAnalysis'

export const initAnalysis = () => {
    const target = ref(parseQuery())
    const remote = useRemoteValue()
    const timeFormat = localRef('analysis_timeFormat', isTimeFormat, 'default')

    const { data: rows, loading } = useRequest(
        () => target.value ? queryRows(target.value, remote.value) : undefined,
        { deps: [target, remote] },
    )
    useProvide<Context>(NAMESPACE, { target, timeFormat, rows })

    return { loading, timeFormat }
}

export const useAnalysisTarget = () => useProvider<Context, 'target'>(NAMESPACE, "target").target

export const useAnalysisTimeFormat = () => useProvider<Context, 'timeFormat'>(NAMESPACE, "timeFormat").timeFormat

export const useAnalysisRows = () => useProvider<Context, 'rows'>(NAMESPACE, "rows").rows