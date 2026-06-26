/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { getOption, getWeekStartDay } from "@api/sw/option"
import ColumnHeader from "@app/components/common/ColumnHeader"
import { useDelayDuration, useLimitAction, useLimitData } from "@app/components/Limit/context"
import { t } from '@app/locale'
import { Delete, Edit } from '@element-plus/icons-vue'
import { localRef, useRequest } from '@hooks'
import { locale } from '@i18n'
import { isEffective } from "@util/limit"
import { MILL_PER_SECOND } from "@util/time"
import {
    ElButton, ElSwitch, ElTable, ElTableColumn, ElTag, type RenderRowData, type Sort, type TableInstance,
} from "element-plus"
import { createObjectGuard, createStringUnionGuard, isAny } from 'typescript-guard'
import { defineComponent, ref } from "vue"
import Rule from "./Rule"
import Waste from "./Waste"
import Weekday from "./Weekday"

const ACTION_WIDTH: { [locale in tt4b.Locale]: number } = {
    en: 220,
    zh_CN: 200,
    ja: 200,
    zh_TW: 200,
    pt_PT: 250,
    uk: 260,
    es: 240,
    de: 250,
    fr: 230,
    ru: 240,
    ar: 220,
    tr: 220,
    pl: 220,
    it: 220,
}

type SortCol = 'waste' | 'weeklyWaste'
const isSort = createObjectGuard<Sort>({
    prop: createStringUnionGuard<SortCol>('waste', 'weeklyWaste'),
    order: createStringUnionGuard<Sort['order']>('ascending', 'descending'),
    init: isAny,
    silent: isAny,
})

function createSorter(key: SortCol) {
    return (a: tt4b.limit.Item, b: tt4b.limit.Item) => a[key] - b[key]
}

function sortByEffectiveDays(a: tt4b.limit.Item, b: tt4b.limit.Item) {
    return (a.weekdays?.length ?? 0) - (b.weekdays?.length ?? 0)
}

const _default = defineComponent<{}>(() => {
    const { data: weeklyInfo } = useRequest(async () => {
        const offset = await getWeekStartDay()
        const weekStart = t(msg => msg.calendar.weekDays)?.split('|')?.[offset] ?? 'NaN'
        return t(msg => msg.limit.item.weekStartInfo, { weekStart })
    })

    const { list, selected, changeEnabled, changeDelay, changeLocked } = useLimitData()
    const { modify, remove } = useLimitAction()
    const delayDuration = useDelayDuration()

    const sort = localRef<Sort>('__limit_sort__', isSort, { prop: 'waste', order: 'descending' })
    const table = ref<TableInstance>()

    const { data: lockVisible } = useRequest(async () => {
        const option = await getOption()
        return option.limitLevel !== 'nothing'
    }, { defaultValue: false })

    return () => (
        <ElTable
            ref={table}
            border fit highlightCurrentRow
            style={{ width: "100%" }}
            height="100%"
            data={list.value}
            defaultSort={sort.value}
            onSort-change={val => isSort(val) && (sort.value = val)}
            onSelection-change={val => selected.value = val}
        >
            <ElTableColumn type="selection" align="center" fixed="left" />
            <ElTableColumn
                prop='name'
                label={t(msg => msg.limit.item.name)}
                minWidth={120}
                align="center"
                formatter={({ name }: tt4b.limit.Item) => name || '-'}
                fixed
                sortable
                sortBy={(row: tt4b.limit.Item) => row.name}
            />
            <ElTableColumn
                label={t(msg => msg.limit.item.condition)}
                minWidth={180}
                align="center"
                formatter={({ cond }: tt4b.limit.Item) => <>{cond?.map?.(c => <span style={{ display: "block" }}>{c}</span>) || ''}</>}
            />
            <ElTableColumn
                label={t(msg => msg.limit.item.detail)}
                minWidth={200}
                align="center"
            >
                {({ row }: RenderRowData<tt4b.limit.Item>) => <Rule value={row} />}
            </ElTableColumn>
            <ElTableColumn
                prop='effectiveDays'
                label={t(msg => msg.limit.item.effectiveDay)}
                minWidth={170}
                align="center"
                sortable
                sortMethod={sortByEffectiveDays}
            >
                {({ row: { weekdays } }: RenderRowData<tt4b.limit.Item>) => <Weekday value={weekdays} />}
            </ElTableColumn>
            <ElTableColumn
                prop={'waste' satisfies SortCol}
                sortable
                sortMethod={createSorter('waste')}
                label={t(msg => msg.calendar.range.today)}
                minWidth={90}
                align="center"
            >
                {({ row }: RenderRowData<tt4b.limit.Item>) => isEffective(row.weekdays) ? (
                    <Waste
                        time={{ wasted: row.waste, maxLimit: (row.time ?? 0) * MILL_PER_SECOND }}
                        delay={{ count: row.delayCount, duration: delayDuration.value, allow: !!row.allowDelay }}
                        count={row.count ?? 0}
                        visit={row.visit ?? 0}
                    />
                ) : (
                    <ElTag type="info" size="small">
                        {t(msg => msg.limit.item.notEffective)}
                    </ElTag>
                )}
            </ElTableColumn>
            <ElTableColumn
                prop={'weeklyWaste' satisfies SortCol}
                minWidth={110}
                align="center"
                sortable
                sortMethod={createSorter('weeklyWaste')}
                v-slots={{
                    header: () => (
                        <ColumnHeader
                            label={t(msg => msg.calendar.range.thisWeek)}
                            tooltipContent={weeklyInfo.value}
                        />
                    ),
                    default: ({ row: {
                        weeklyWaste, weekly,
                        weeklyVisit, weeklyCount,
                        weeklyDelayCount, allowDelay,
                    } }: RenderRowData<tt4b.limit.Item>) => (
                        <Waste
                            time={{ wasted: weeklyWaste, maxLimit: (weekly ?? 0) * MILL_PER_SECOND }}
                            delay={{ count: weeklyDelayCount, duration: delayDuration.value, allow: !!allowDelay }}
                            count={weeklyCount ?? 0}
                            visit={weeklyVisit ?? 0}
                        />
                    ),
                }}
            />
            <ElTableColumn label={t(msg => msg.button.configuration)}>
                <ElTableColumn
                    label={t(msg => msg.limit.item.enabled)}
                    minWidth={80}
                    align="center"
                    fixed="right"
                >
                    {({ row }: RenderRowData<tt4b.limit.Item>) => (
                        <ElSwitch size="small" modelValue={row.enabled} onChange={v => changeEnabled(row, !!v)} />
                    )}
                </ElTableColumn>
                <ElTableColumn
                    label={t(msg => msg.shared.limit.allowDelay)}
                    minWidth={80}
                    align="center"
                    fixed="right"
                >
                    {({ row }: RenderRowData<tt4b.limit.Item>) => (
                        <ElSwitch size="small" modelValue={row.allowDelay} onChange={v => changeDelay(row, !!v)} />
                    )}
                </ElTableColumn>
                {lockVisible.value && (
                    <ElTableColumn
                        label={t(msg => msg.limit.item.locked)}
                        minWidth={80}
                        align="center"
                        fixed="right"
                    >
                        {({ row }: RenderRowData<tt4b.limit.Item>) => (
                            <ElSwitch size="small" modelValue={row.locked} onChange={v => changeLocked(row, !!v)} />
                        )}
                    </ElTableColumn>
                )}
            </ElTableColumn>
            <ElTableColumn
                label={t(msg => msg.button.operation)}
                width={ACTION_WIDTH[locale]}
                align="center"
                fixed="right"
                v-slots={({ row }: RenderRowData<tt4b.limit.Item>) => <>
                    <ElButton type="danger" size="small" icon={Delete} onClick={() => remove(row)}>
                        {t(msg => msg.button.delete)}
                    </ElButton>
                    <ElButton type="primary" size="small" icon={Edit} onClick={() => modify(row)}>
                        {t(msg => msg.button.modify)}
                    </ElButton>
                </>}
            />
        </ElTable>
    )
})

export default _default