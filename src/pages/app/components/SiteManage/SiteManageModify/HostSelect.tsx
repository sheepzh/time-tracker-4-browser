/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import siteDatabase from '@db/site-database'
import { useManualRequest } from "@hooks"
import { listHosts } from "@service/stat-service"
import { MERGED_HOST, ALL_HOSTS as REMAIN_HOSTS } from "@util/constant/remain-host"
import { isValidVirtualHost, judgeVirtualFast } from "@util/pattern"
import { ElOption, ElSelect, ElTag } from "element-plus"
import { computed, defineComponent } from "vue"
import { cvt2OptionValue, cvt2SiteKey, EXIST_MSG, labelOf, MERGED_MSG, VIRTUAL_MSG } from "../common"

type _OptionInfo = {
    siteKey: timer.site.SiteKey
    hasAlias: boolean
}

function cleanQuery(query: string) {
    try {
        const url = new URL(query)
        const { host, pathname } = url
        query = host + pathname
    } catch {
    }
    if (query.endsWith('/')) query += '**'
    return query
}

async function handleRemoteSearch(query: string): Promise<_OptionInfo[]> {
    query = cleanQuery(query)
    if (!query) return []
    const { normal, merged } = await listHosts(query)
    const allAlias: timer.site.SiteKey[] = [
        ...normal.map(host => ({ host, type: 'normal' } satisfies timer.site.SiteKey)),
        ...merged.map(host => ({ host, type: 'merged' } satisfies timer.site.SiteKey)),
    ]
    // Add local files
    REMAIN_HOSTS.filter(h => h.includes(query)).forEach(remain => allAlias.push({ host: remain, type: 'normal' }))
    MERGED_HOST.includes(query) && allAlias.push({ host: MERGED_HOST, type: 'merged' })
    const existedAliasSet = new Set()
    const existedKeys = await siteDatabase.existBatch(allAlias)
    existedKeys.forEach(key => existedAliasSet.add(cvt2OptionValue(key)))
    const existedOptions: _OptionInfo[] = []
    const notExistedOptions: _OptionInfo[] = []
    allAlias.forEach(siteKey => {
        const hasAlias = existedAliasSet.has(cvt2OptionValue(siteKey))
        const props: _OptionInfo = { siteKey, hasAlias }
        hasAlias ? existedOptions.push(props) : notExistedOptions.push(props)
    })

    const originalOptions = [...notExistedOptions, ...existedOptions]

    const result: _OptionInfo[] = []
    const existIdx = originalOptions.findIndex(o => o.siteKey?.host === query)
    if (existIdx === -1) {
        // Not exist host, insert site into the first
        const isVirtual = judgeVirtualFast(query)
        if (isVirtual) {
            isValidVirtualHost(query) && result.push({ siteKey: { host: query, type: 'virtual' }, hasAlias: false })
        } else {
            result.push({ siteKey: { host: query, type: 'normal' }, hasAlias: false })
        }
        result.push(...originalOptions)
    } else {
        result.push(originalOptions[existIdx])
        originalOptions.forEach((opt, idx) => idx !== existIdx && result.push(opt))
    }
    return result
}

type Props = {
    modelValue: timer.site.SiteKey | undefined
    onChange?: (_siteKey: timer.site.SiteKey | undefined) => void
}

const _default = defineComponent<Props>(props => {
    const value = computed(() => cvt2OptionValue(props.modelValue))
    const { data: options, loading: searching, refresh: searchOption } = useManualRequest(handleRemoteSearch)

    return () => (
        <ElSelect
            style={{ width: '100%' }}
            modelValue={value.value}
            filterable
            remote
            loading={searching.value}
            remoteMethod={searchOption}
            onChange={val => props.onChange?.(cvt2SiteKey(val))}
        >
            {options.value?.map(({ siteKey, hasAlias }) => (
                <ElOption value={cvt2OptionValue(siteKey)} disabled={hasAlias} label={labelOf(siteKey, hasAlias)}>
                    <span>{siteKey.host}</span>
                    <ElTag v-show={siteKey.type === 'merged'} size="small">{MERGED_MSG}</ElTag>
                    <ElTag v-show={siteKey.type === 'virtual'} size="small">{VIRTUAL_MSG}</ElTag>
                    <ElTag v-show={hasAlias} size="small" type="info">{EXIST_MSG}</ElTag>
                </ElOption>
            ))}
        </ElSelect>
    )
}, { props: ['modelValue', 'onChange'] })

export default _default
