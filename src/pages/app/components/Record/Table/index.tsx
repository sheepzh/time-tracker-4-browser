/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { modifySite } from '@api/sw/site'
import ContentCard from '@app/components/common/ContentCard'
import Editable from '@app/components/common/Editable'
import HostAlert from '@app/components/common/HostAlert'
import Pagination from '@app/components/common/Pagination'
import { t } from '@app/locale'
import { cvt2LocaleTime } from '@app/util/time'
import { Histogram } from "@element-plus/icons-vue"
import { useDocumentVisibility, useManualRequest, useRequest, useState } from '@hooks'
import { Flex, TooltipWrapper } from '@pages/components'
import { isRtl } from "@util/document"
import { identifySiteKey } from '@util/site'
import { getAlias, getComposition, isSite } from "@util/stat"
import { Effect, ElLink, ElTable, ElTableColumn, ElText, ElTooltip, type TableInstance } from "element-plus"
import { createObjectGuard, createStringUnionGuard, isAny } from 'typescript-guard'
import { computed, defineComponent, ref, watch, type FunctionalComponent } from "vue"
import { queryPage } from "../common"
import CompositionTable from '../components/CompositionTable'
import TooltipSiteList from '../components/TooltipSiteList'
import { useRecordFilter, useRecordSort, useSummary } from "../context"
import type { DisplayComponent, RecordFilterOption, RecordSort, RowData, SiteMerge } from "../types"
import CateColumn from "./columns/CateColumn"
import GroupColumn from "./columns/GroupColumn"
import OperationColumn from "./columns/OperationColumn"
import TimeColumn from "./columns/TimeColumn"

type ColumnVisible = Record<'index' | 'date' | 'site' | 'cate' | 'group', boolean>

const computeVisible = ({ siteMerge, mergeDate }: RecordFilterOption): ColumnVisible => ({
    index: !siteMerge || siteMerge === 'group',
    date: !mergeDate,
    site: !siteMerge || siteMerge === 'domain',
    cate: !siteMerge || siteMerge === 'cate',
    group: siteMerge === 'group',
})

const isRecordSort = createObjectGuard<RecordSort>({
    order: createStringUnionGuard<RecordSort['order']>('ascending', 'descending'),
    prop: createStringUnionGuard<RecordSort['prop']>('date', 'host', 'focus', 'time'),
    init: isAny,
    silent: isAny,
})

const HostCell: FunctionalComponent<{ row: tt4b.stat.Row, merge?: SiteMerge }> = ({ row, merge }) => isSite(row) ? (
    <Flex key={identifySiteKey(row.siteKey)} justify="center">
        <TooltipWrapper
            usePopover={merge === 'domain'}
            effect={Effect.LIGHT}
            offset={10}
            placement="left"
            v-slots={{
                content: () => <TooltipSiteList modelValue={row.mergedRows} />,
                default: () => <HostAlert value={row.siteKey} iconUrl={row.iconUrl} />,
            }}
        />
    </Flex>
) : null

const _default = defineComponent<{}>((_, ctx) => {
    const rtl = isRtl()
    const [page, setPage] = useState<tt4b.common.PageQuery>({ size: 20, num: 1 })
    const sort = useRecordSort()
    const filter = useRecordFilter()
    const visible = computed(() => computeVisible(filter))
    const { data, refresh, loading } = useRequest(() => queryPage(filter, sort.value, page.value), {
        loadingTarget: () => table.value?.$el,
        deps: [() => ({ ...filter }), sort, page],
        defaultValue: { list: [], total: 0 },
    })
    const summary = useSummary()
    const runVisible = computed(() => data.value.list.some(r => r.run))
    const mediaVisible = computed(() => data.value.list.some(r => r.media))
    // Query data if document become visible
    const docVisible = useDocumentVisibility()
    watch(docVisible, () => docVisible.value && refresh())

    const [selection, setSelection] = useState<tt4b.stat.Row[]>([])
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

    const { refresh: changeAlias } = useManualRequest((row: tt4b.stat.SiteRow, newAlias: string | undefined) => {
        const { siteKey: { type, host }, iconUrl } = row
        return modifySite({ type, host, alias: newAlias, iconUrl })
    }, { onSuccess: refresh })

    return () => (
        <ContentCard>
            <Flex gap={23} width="100%" height="100%" column>
                <Flex flex={1} height={0}>
                    <ElTable
                        ref={table}
                        data={data.value.list}
                        border fit highlightCurrentRow
                        height="100%"
                        defaultSort={sort.value}
                        onSelection-change={setSelection}
                        onSort-change={val => isRecordSort(val) && (sort.value = val)}
                    >
                        {visible.value.index && (
                            <ElTableColumn
                                key="index"
                                type="selection"
                                align="center"
                                fixed="left"
                            />
                        )}
                        {visible.value.date && (
                            <ElTableColumn
                                key='date'
                                prop={'date' satisfies RecordSort['prop']}
                                label={t(msg => msg.item.date)}
                                minWidth={135}
                                align="center"
                                sortable="custom"
                            >
                                {({ row }: RowData) => cvt2LocaleTime(row.date)}
                            </ElTableColumn>
                        )}
                        {visible.value.site && <>
                            <ElTableColumn
                                prop={'host' satisfies RecordSort['prop']}
                                label={t(msg => msg.item.host)}
                                minWidth={210}
                                sortable="custom"
                                align="center"
                                v-slots={({ row }: RowData) => <HostCell row={row} merge={filter.siteMerge} />}
                            />
                            <ElTableColumn
                                label={t(msg => msg.siteManage.column.alias)}
                                minWidth={140}
                                align="center"
                                v-slots={({ row }: { row: tt4b.stat.Row }) => (
                                    <Editable
                                        modelValue={getAlias(row)}
                                        onChange={newAlias => 'siteKey' in row && changeAlias(row, newAlias)}
                                    />
                                )}
                            />
                        </>}
                        {visible.value.group && <GroupColumn />}
                        {visible.value.cate && <CateColumn onChange={refresh} />}
                        <TimeColumn dimension="focus" />
                        {runVisible.value && <TimeColumn dimension="run" sortable={false} />}
                        {mediaVisible.value && <TimeColumn dimension="media" sortable={false} />}
                        <ElTableColumn
                            prop={'time' satisfies RecordSort['prop']}
                            label={t(msg => msg.item.time)}
                            minWidth={130}
                            align="center"
                            sortable="custom"
                        >
                            {({ row }: RowData) => (
                                <TooltipWrapper
                                    usePopover={filter.readRemote}
                                    placement="top"
                                    effect={Effect.LIGHT}
                                    offset={10}
                                    v-slots={{
                                        default: () => row.time,
                                        content: () => <CompositionTable data={getComposition(row, 'time')} />,
                                    }}
                                />
                            )}
                        </ElTableColumn>
                        <OperationColumn onDelete={refresh} />
                    </ElTable>
                </Flex>
                <Flex justify="center" width="100%" gap={8} align="center">
                    <ElTooltip
                        effect="light"
                        placement={rtl ? 'right' : 'left'}
                        onUpdate:visible={val => val && summary.refresh()}
                        v-slots={{
                            content: () => (
                                <ElText v-loading={summary.loading.value}>
                                    {t(msg => msg.record.total, { ...summary.data.value })}
                                </ElText>
                            ),
                            default: () => <ElLink underline="never" icon={Histogram} />,
                        }}
                    />
                    <Pagination
                        disabled={loading.value}
                        defaultValue={page.value}
                        total={data.value.total}
                        onChange={setPage}
                    />
                </Flex>
            </Flex>
        </ContentCard>
    )
})

export default _default
