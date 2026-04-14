import { searchSite } from "@api/sw/site"
import { useAnalysisTarget } from '@app/components/Analysis/context'
import type { AnalysisTarget } from '@app/components/Analysis/types'
import { labelOfHostInfo } from '@app/components/Analysis/util'
import { useCategory } from '@app/context'
import { t } from '@app/locale'
import { useDebounceState, useRequest } from '@hooks'
import Flex from "@pages/components/Flex"
import { CATE_NOT_SET_ID, identifySiteKey, parseSiteIdentity, SiteMap } from "@util/site"
import { ElSelectV2, ElTag, useNamespace } from "element-plus"
import type { OptionType } from "element-plus/es/components/select-v2/src/select.types"
import { computed, defineComponent, type FunctionalComponent, onMounted, ref, type StyleValue } from "vue"

const SITE_PREFIX = 'S'
const CATE_PREFIX = 'C'

const cvtTarget2Key = (target: AnalysisTarget | undefined): string => {
    const { type, key } = target ?? {}
    switch (type) {
        case 'site': return `${SITE_PREFIX}${identifySiteKey(key)}`
        case 'cate': return `${CATE_PREFIX}${key}`
        default: return '-'
    }
}

const cvtKey2Target = (key: string | undefined): AnalysisTarget | undefined => {
    if (!key) return undefined
    const prefix = key.charAt(0)
    const content = key.substring(1)
    if (prefix === SITE_PREFIX) {
        const key = parseSiteIdentity(content)
        if (key) return { type: 'site', key }
    } else if (prefix === CATE_PREFIX) {
        let cateId: number | undefined
        try {
            cateId = parseInt(content)
        } catch { }
        if (cateId) return { type: 'cate', key: cateId }
    }
    return undefined
}

type TargetItem = AnalysisTarget & {
    label: string
}

const fetchItems = async (categories: timer.site.Cate[]): Promise<[siteItems: TargetItem[], cateItems: TargetItem[]]> => {
    // 1. query categories
    const cateItems: TargetItem[] = categories.map(({ id, name }) => ({ type: 'cate', key: id, label: name }))

    // 2. query sites
    const sites = await searchSite()
    const siteMap = SiteMap.identify(sites)
    const siteItems: TargetItem[] = siteMap.map((_, key) => ({ type: 'site', key, label: labelOfHostInfo(key) }))

    return [cateItems, siteItems]
}

const SiteTypeTag: FunctionalComponent<{ text: string }> = ({ text }) => (
    <span style={{ float: "right", height: "34px" }}>
        <ElTag size="small">{text}</ElTag>
    </span>
)

const SiteOption = defineComponent<{ value: timer.site.SiteInfo }>(props => {
    const alias = computed(() => props.value.alias)
    const type = computed(() => props.value.type)
    const mergedText = t(msg => msg.analysis.common.merged)
    const virtualText = t(msg => msg.analysis.common.virtual)

    return () => (
        <Flex align="center" gap={4}>
            <span>{props.value.host}</span>
            <ElTag v-show={!!alias.value} size="small" type="info">
                {alias.value}
            </ElTag>
            {type.value === 'merged' && < SiteTypeTag text={mergedText} />}
            {type.value === 'virtual' && <SiteTypeTag text={virtualText} />}
        </Flex>
    )
}, { props: ['value'] })

const TargetSelect = defineComponent(() => {
    const cate = useCategory()

    const target = useAnalysisTarget()
    const selectKey = computed({
        get: () => cvtTarget2Key(target.value),
        set: key => target.value = cvtKey2Target(key),
    })

    const { data: allItems } = useRequest(
        () => fetchItems([...cate.all, { id: CATE_NOT_SET_ID, name: t(msg => msg.shared.cate.notSet) }]),
        { defaultValue: [[], []], deps: [() => cate.all] },
    )

    const [query, setQuery] = useDebounceState('', 50)
    const options = computed(() => {
        const q = query.value.trim()
        let [cateItems, siteItems] = allItems.value
        if (q) {
            siteItems = siteItems.filter(({ key, type }) => {
                if (type !== 'site') return false
                const { host, alias } = key
                return host.includes(q) || alias?.includes(q)
            })
            cateItems = cateItems.filter(item => item.label.includes(q))
        }

        let res: OptionType[] = []
        cate.enabled && cateItems.length && res.push({
            value: 'cate',
            label: t(msg => msg.analysis.target.cate),
            options: cateItems.map(item => ({ value: cvtTarget2Key(item), label: item.label, data: item })),
        })
        siteItems.length && res.push({
            value: 'site',
            label: t(msg => msg.analysis.target.site),
            options: siteItems.map(item => ({ value: cvtTarget2Key(item), label: item.label, data: item })),
        })
        if (res.length === 1) {
            // Single content, not use group
            res = res[0].options
        }
        return res
    })

    const ns = useNamespace('select')
    const select = ref<InstanceType<typeof ElSelectV2>>()
    onMounted(() => {
        let el = select.value?.$el
        if (!(el instanceof HTMLElement)) return
        el.click()
        const input = el.querySelector(`.${ns.e('input')}`)
        const wrapper = el.querySelector(`.${ns.e('wrapper')}`)
        if (input instanceof HTMLInputElement) {
            input.click()
            input.focus()
        }
        if (wrapper instanceof HTMLElement) wrapper.classList.add(ns.is('focused'))
    })

    return () => (
        <ElSelectV2
            ref={select}
            placeholder={t(msg => msg.analysis.common.hostPlaceholder)}
            modelValue={selectKey.value}
            onChange={val => selectKey.value = val}
            filterable
            filterMethod={setQuery}
            style={{ width: '240px' } as StyleValue}
            defaultFirstOption
            options={options.value ?? []}
            fitInputWidth={false}
            v-slots={({ item }: any) => {
                const target = (item as any).data as TargetItem
                return target?.type === 'site' ? <SiteOption value={target?.key} /> : target?.label
            }}
        />
    )
})

export default TargetSelect