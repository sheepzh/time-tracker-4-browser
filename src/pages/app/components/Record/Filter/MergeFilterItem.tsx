import { t } from '@app/locale'
import { Calendar, Collection, Link, Menu } from "@element-plus/icons-vue"
import { useSiteMerge } from '@hooks'
import { Flex } from '@pages/components'
import { truthy } from '@util/lang'
import { ElCheckboxButton, ElCheckboxGroup, ElIcon, ElText, ElTooltip } from "element-plus"
import { createArrayGuard, createStringUnionGuard } from 'typescript-guard'
import { type Component, computed, defineComponent, h } from "vue"
import { useRecordFilter } from "../context"

const METHOD_ICONS: Record<tt4b.stat.MergeMethod, Component> = {
    cate: Collection,
    date: Calendar,
    domain: Link,
    group: Menu,
}

const isMergeMethod = createArrayGuard(
    createStringUnionGuard<tt4b.stat.MergeMethod>('cate', 'date', 'domain', 'group')
)

const MergeFilterItem = defineComponent<{}>(() => {
    const filter = useRecordFilter()
    const siteMergeMethods = useSiteMerge()
    const items = computed<tt4b.stat.MergeMethod[]>(() => ['date', ...siteMergeMethods.value])
    const selected = computed<tt4b.stat.MergeMethod[]>({
        get: () => truthy(filter.mergeDate && 'date', filter.siteMerge),
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

    return () => (
        <Flex gap={9}>
            <ElText tag="b" type="info">
                {t(msg => msg.shared.merge.mergeBy)}
            </ElText>
            <ElCheckboxGroup modelValue={selected.value} onChange={v => isMergeMethod(v) && (selected.value = v)}>
                {items.value.map(method => (
                    <ElCheckboxButton key={method} value={method}>
                        <ElTooltip content={t(msg => msg.shared.merge.mergeMethod[method])} offset={20} placement="top">
                            <span style={{ margin: '-6px' }}>
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