import { useCategory } from '@app/context'
import { t } from '@app/locale'
import { Calendar, Collection, Link, Menu } from "@element-plus/icons-vue"
import { useSiteMerge } from '@hooks'
import Flex from "@pages/components/Flex"
import { ElCheckboxButton, ElCheckboxGroup, ElIcon, ElText, ElTooltip } from "element-plus"
import { createArrayGuard, createStringUnionGuard } from 'typescript-guard'
import { type Component, computed, defineComponent, h, type StyleValue } from "vue"
import { useRecordFilter } from "../context"

const METHOD_ICONS: Record<tt4b.stat.MergeMethod, Component> = {
    cate: Collection,
    date: Calendar,
    domain: Link,
    group: Menu,
}

const isMergeMethods = createArrayGuard(
    createStringUnionGuard<tt4b.stat.MergeMethod>('cate', 'date', 'domain', 'group')
)

const ICON_STYLE: StyleValue = { margin: '-6px' }

const MergeFilterItem = defineComponent<{}>(() => {
    const filter = useRecordFilter()
    const cate = useCategory()
    const { methods: siteMergeMethods } = useSiteMerge()
    const items = computed(() => {
        const res = ['date', ...siteMergeMethods.value] satisfies tt4b.stat.MergeMethod[]
        return cate.enabled ? res : res.filter(m => m !== 'cate')
    })
    const selected = computed({
        get: () => {
            const { mergeDate, siteMerge } = filter
            const res: tt4b.stat.MergeMethod[] = []
            mergeDate && (res.push('date'))
            siteMerge && (res.push(siteMerge))
            return res
        },
        set: val => {
            filter.mergeDate = val.includes('date')
            const oldSiteMerge = filter.siteMerge
            const newSiteMerge = siteMergeMethods.value
                .filter(t => val.includes(t))
                .sort(t => oldSiteMerge?.includes(t) ? 1 : -1)[0]
            filter.siteMerge = newSiteMerge
            newSiteMerge && newSiteMerge !== 'cate' && (filter.cateIds = [])
        }
    })

    const handleChange = (val: unknown) => isMergeMethods(val) && (selected.value = val)

    return () => (
        <Flex gap={9}>
            <ElText tag="b" type="info">
                {t(msg => msg.shared.merge.mergeBy)}
            </ElText>
            <ElCheckboxGroup modelValue={selected.value} onChange={handleChange}>
                {items.value.map(method => (
                    <ElCheckboxButton value={method}>
                        <ElTooltip content={t(msg => msg.shared.merge.mergeMethod[method])} offset={20} placement="top">
                            <span style={ICON_STYLE}>
                                <ElIcon>{h(METHOD_ICONS[method])}</ElIcon>
                            </span>
                        </ElTooltip>
                    </ElCheckboxButton>
                ))}
            </ElCheckboxGroup>
        </Flex>
    )
})

export default MergeFilterItem