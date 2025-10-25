import { useCategory } from '@app/context'
import { t } from "@app/locale"
import { Calendar, Collection, Link, Menu } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { IS_ANDROID } from "@util/constant/environment"
import { ALL_MERGE_METHODS } from "@util/merge"
import { ElCheckboxButton, ElCheckboxGroup, ElIcon, ElText, ElTooltip } from "element-plus"
import { computed, defineComponent, StyleValue } from "vue"
import { type JSX } from "vue/jsx-runtime"
import { useReportFilter } from "../context"
import type { ReportFilterOption } from "../types"

const METHOD_ICONS: Record<timer.stat.MergeMethod, JSX.Element> = {
    cate: <Collection />,
    date: <Calendar />,
    domain: <Link />,
    group: <Menu />,
}

const METHODS = IS_ANDROID ? ALL_MERGE_METHODS.filter(m => m !== 'group') : ALL_MERGE_METHODS

const MergeFilterItem = defineComponent<{}>(() => {
    const filter = useReportFilter()
    const cate = useCategory()
    const mergeMethod = computed({
        get: () => {
            const { mergeDate, siteMerge } = filter
            const res: timer.stat.MergeMethod[] = []
            mergeDate && (res.push('date'))
            siteMerge && (res.push(siteMerge))
            return res
        },
        set: val => {
            filter.mergeDate = val.includes('date')
            const oldSiteMerge = filter.siteMerge
            const newSiteMerge = (['cate', 'domain', 'group'] satisfies ReportFilterOption['siteMerge'][])
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
            <ElCheckboxGroup
                modelValue={mergeMethod.value}
                onChange={val => mergeMethod.value = val as timer.stat.MergeMethod[]}
            >
                {METHODS.filter(m => m !== 'cate' || cate.enabled).map(method => (
                    <ElCheckboxButton value={method}>
                        <ElTooltip content={t(msg => msg.shared.merge.mergeMethod[method])} offset={20} placement="top">
                            <span style={{ margin: '-6px' } satisfies StyleValue}>
                                <ElIcon>{METHOD_ICONS[method]}</ElIcon>
                            </span>
                        </ElTooltip>
                    </ElCheckboxButton>
                ))}
            </ElCheckboxGroup>
        </Flex >
    )
}, { props: ['hideCate'] })

export default MergeFilterItem