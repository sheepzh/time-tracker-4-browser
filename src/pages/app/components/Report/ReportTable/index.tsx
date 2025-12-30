/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import ContentCard from "@app/components/common/ContentCard"
import Editable from "@app/components/common/Editable"
import Pagination from "@app/components/common/Pagination"
import { t } from "@app/locale"
import { periodFormatter } from "@app/util/time"
import { Histogram } from "@element-plus/icons-vue"
import { useDocumentVisibility, useManualRequest, useRequest, useState } from "@hooks"
import Flex from "@pages/components/Flex"
import { removeAlias, saveAlias } from '@service/site-service'
import { selectCate, selectGroup, selectSite, type SiteQuery } from "@service/stat-service"
import { sum } from "@util/array"
import { isRtl } from "@util/document"
import { siteEqual } from "@util/site"
import { getAlias, isSite } from "@util/stat"
import { ElLink, ElTable, ElTableColumn, ElText, ElTooltip, type TableInstance } from "element-plus"
import { computed, defineComponent, ref, watch } from "vue"
import { queryPage } from "../common"
import { useReportFilter, useReportSort } from "../context"
import type { DisplayComponent, ReportFilterOption, ReportSort } from "../types"
import CateColumn from "./columns/CateColumn"
import DateColumn from "./columns/DateColumn"
import GroupColumn from "./columns/GroupColumn"
import HostColumn from "./columns/HostColumn"
import OperationColumn from "./columns/OperationColumn"
import TimeColumn from "./columns/TimeColumn"
import VisitColumn from "./columns/VisitColumn"

async function handleAliasChange(key: timer.site.SiteKey, newAlias: string | undefined, data: timer.stat.Row[]) {
    newAlias = newAlias?.trim?.()
    if (!newAlias) {
        await removeAlias(key)
    } else {
        await saveAlias(key, newAlias)
    }
    data?.filter(isSite)
        ?.filter(item => siteEqual(item.siteKey, key))
        ?.forEach(item => item.alias = newAlias)
}

type ColumnVisible = Record<'index' | 'date' | 'site' | 'cate' | 'group', boolean>

const computeVisible = (filter: ReportFilterOption): ColumnVisible => {
    const { siteMerge, mergeDate } = filter
    return {
        index: !siteMerge || siteMerge === 'group',
        date: !mergeDate,
        site: !siteMerge || siteMerge === 'domain',
        cate: !siteMerge || siteMerge === 'cate',
        group: siteMerge === 'group',
    }
}

const _default = defineComponent((_, ctx) => {
    const rtl = isRtl()
    const [page, setPage] = useState<timer.common.PageQuery>({ size: 20, num: 1 })
    const sort = useReportSort()
    const filter = useReportFilter()
    const visible = computed(() => computeVisible(filter))
    const { data, refresh, loading } = useRequest(() => queryPage(filter, sort.value, page.value), {
        loadingTarget: () => table.value?.$el as HTMLDivElement,
        deps: [() => ({ ...filter }), sort, page],
        defaultValue: { list: [], total: 0 },
    })
    const {
        data: total,
        refresh: refreshTotal,
        loading: totalLoading,
    } = useManualRequest(async () => {
        const { siteMerge, dateRange: date, query, readRemote: inclusiveRemote, cateIds } = filter
        let rows: timer.stat.Row[] = []
        if (siteMerge === 'group') {
            rows = await selectGroup({ date, query })
        } else if (siteMerge === 'cate') {
            rows = await selectCate({ date, query, cateIds, inclusiveRemote })
        } else {
            const param: SiteQuery = {
                date, query, cateIds, inclusiveRemote,
                mergeHost: siteMerge === 'domain',
            }
            rows = await selectSite(param)
        }
        const visit = sum(rows.map(e => e.time))
        const focus = sum(rows.map(e => e.focus))
        return { visit, focus }
    }, { defaultValue: { visit: 0, focus: 0 } })

    const runColVisible = computed(() => !!data.value?.list?.find(r => r.run))
    // Query data if document become visible
    const docVisible = useDocumentVisibility()
    watch(docVisible, () => docVisible.value && refresh())

    const [selection, setSelection] = useState<timer.stat.Row[]>([])
    ctx.expose({
        getSelected: () => selection.value,
        refresh,
    } satisfies DisplayComponent)

    const table = ref<TableInstance>()
    // Force to re-layout after merge change
    watch([
        () => filter.mergeDate,
        () => filter.siteMerge,
    ], () => table.value?.doLayout?.())

    return () => (
        <ContentCard>
            <Flex gap={23} width="100%" height="100%" column>
                <Flex flex={1} height={0}>
                    <ElTable
                        ref={table}
                        data={data.value?.list}
                        border fit highlightCurrentRow
                        height="100%"
                        defaultSort={sort.value}
                        onSelection-change={setSelection}
                        onSort-change={(val: ReportSort) => sort.value = val}
                    >
                        {visible.value.index && <ElTableColumn type="selection" align="center" fixed="left" />}
                        {visible.value.date && <DateColumn />}
                        {visible.value.site && <>
                            <HostColumn />
                            <ElTableColumn
                                label={t(msg => msg.siteManage.column.alias)}
                                minWidth={140}
                                align="center"
                                v-slots={({ row }: { row: timer.stat.Row }) => (
                                    <Editable
                                        modelValue={getAlias(row)}
                                        onChange={newAlias => 'siteKey' in row && handleAliasChange(row.siteKey, newAlias, data.value?.list ?? [])}
                                    />
                                )}
                            />
                        </>}
                        {visible.value.group && <GroupColumn />}
                        {visible.value.cate && <CateColumn onChange={refresh} />}
                        <TimeColumn dimension="focus" />
                        {runColVisible.value && <TimeColumn dimension="run" />}
                        <VisitColumn />
                        <OperationColumn onDelete={refresh} />
                    </ElTable>
                </Flex>
                <Flex justify="center" width="100%" gap={8} align="center">
                    <ElTooltip
                        effect="light"
                        placement={rtl ? 'right' : 'left'}
                        onUpdate:visible={val => val && refreshTotal()}
                        v-slots={{
                            content: () => (
                                <ElText v-loading={totalLoading.value}>
                                    {t(msg => msg.report.total, {
                                        visit: total.value.visit,
                                        focus: periodFormatter(total.value.focus, { format: filter.timeFormat }),
                                    })}
                                </ElText>
                            ),
                            default: () => <ElLink underline="never" icon={Histogram} />,
                        }}
                    />
                    <Pagination
                        disabled={loading.value}
                        defaultValue={page.value}
                        total={data.value?.total || 0}
                        onChange={setPage}
                    />
                </Flex>
            </Flex>
        </ContentCard>
    )
})

export default _default
