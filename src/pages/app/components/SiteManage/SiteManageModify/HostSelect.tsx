/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { searchSite } from '@api/sw/site'
import { t } from '@app/locale'
import { useManualRequest } from '@hooks'
import { identifySiteKey, parseSiteKeyFromIdentity } from '@util/site'
import { ElOption, ElSelect, ElTag } from "element-plus"
import { computed, defineComponent } from "vue"

type Props = ModelValue<timer.site.SiteKey | undefined>

const EXIST_MSG = t(msg => msg.siteManage.msg.existedTag)
const MERGED_MSG = t(msg => msg.siteManage.type.merged?.name)?.toLocaleUpperCase?.()
const VIRTUAL_MSG = t(msg => msg.siteManage.type.virtual?.name)?.toLocaleUpperCase?.()

/**
 * Calculate the label of alias key to display
 *
 * @returns
 *      1. www.google.com
 *      2. www.google.com[MERGED]
 *      4. www.google.com[EXISTED]
 *      5. www.github.com/sheepzh/*[VIRTUAL]
 *      5. www.github.com/sheepzh/*[VIRTUAL-EXISTED]
 *      3. www.google.com[MERGED-EXISTED]
 */
function labelOf(site: timer.site.SiteInfo): string {
    let { host: label, type, alias } = site
    const suffix: string[] = []
    type === 'merged' && suffix.push(MERGED_MSG)
    type === 'virtual' && suffix.push(VIRTUAL_MSG)
    alias && suffix.push(EXIST_MSG)
    suffix.length && (label += `[${suffix.join('-')}]`)
    return label
}

function cvt2SiteKey(optionValue: string): timer.site.SiteKey {
    if (!optionValue) return { host: '', type: 'normal' }
    return parseSiteKeyFromIdentity(optionValue) ?? { host: '', type: 'normal' }
}

const _default = defineComponent<Props>(props => {
    const value = computed(() => identifySiteKey(props.modelValue))
    const { data: options, loading: searching, refresh: searchOption } = useManualRequest(
        searchSite, { defaultValue: [] }
    )

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
            {options.value.map(row => (
                <ElOption value={identifySiteKey(row)} disabled={!!row.alias} label={labelOf(row)}>
                    <span>{row.host}</span>
                    <ElTag v-show={row.type === 'merged'} size="small">{MERGED_MSG}</ElTag>
                    <ElTag v-show={row.type === 'virtual'} size="small">{VIRTUAL_MSG}</ElTag>
                    <ElTag v-show={!!row.alias} size="small" type="info">{EXIST_MSG}</ElTag>
                </ElOption>
            ))}
        </ElSelect>
    )
}, { props: ['modelValue', 'onChange'] })

export default _default
