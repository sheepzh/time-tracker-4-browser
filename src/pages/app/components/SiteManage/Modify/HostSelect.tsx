/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { detectSites } from '@api/sw/site'
import { t } from '@app/locale'
import { useDebounceState, useRequest } from '@hooks'
import { extractHostname, isValidVirtualHost, judgeVirtualFast } from '@util/pattern'
import { identifySiteKey, parseSiteIdentity, SiteMap } from '@util/site'
import { ElSelectV2 } from "element-plus"
import { computed, defineComponent } from "vue"

type Props = ModelValue<tt4b.site.SiteKey | undefined>

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
function labelOf(site: tt4b.site.SiteInfo): string {
    let { host: label, type, alias } = site
    const suffix = [
        type !== 'normal' && t(msg => msg.shared.site.type[type]).toLocaleUpperCase(),
        alias && t(msg => msg.siteManage.msg.existedTag),
    ].filter(Boolean).join('-')
    suffix && (label += `[${suffix}]`)
    return label
}

function guessHost(query: string): tt4b.site.SiteKey[] {
    if (query.endsWith('/')) query += '**'
    const result: tt4b.site.SiteKey[] = []
    const { host } = extractHostname(query)
    if (host) result.push({ host, type: 'merged' }, { host, type: 'normal' })

    if (judgeVirtualFast(query) && isValidVirtualHost(query)) {
        result.push({ host: query, type: 'virtual' })
    }
    return result
}

const _default = defineComponent<Props>(props => {
    const value = computed(() => identifySiteKey(props.modelValue))
    const { data: sites } = useRequest(detectSites, { defaultValue: [] })
    const [query, setQuery] = useDebounceState('', 50)
    const options = computed(() => {
        const existed = sites.value
        const filtered = existed.filter(({ host }) => host.includes(query.value))
        const siteMap = SiteMap.identify(filtered)
        const guessed = guessHost(query.value)
        guessed.forEach(s => !siteMap.get(s) && filtered.unshift(s))
        return filtered
            .sort((a, b) => !!a.alias == !!b.alias ? 0 : !!a.alias ? 1 : -1)
            .map(site => ({
                label: labelOf(site),
                value: identifySiteKey(site),
                disabled: !!site.alias,
            }))
    })

    return () => (
        <ElSelectV2
            style={{ width: '100%' }}
            modelValue={value.value}
            filterable
            filterMethod={setQuery}
            onChange={val => props.onChange?.(parseSiteIdentity(val) ?? { host: '', type: 'normal' })}
            options={options.value}
        />
    )
}, { props: ['modelValue', 'onChange'] })

export default _default
