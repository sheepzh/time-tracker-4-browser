/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import ColumnHeader from "@app/components/common/ColumnHeader"
import { t } from "@app/locale"
import { useRequest } from "@hooks"
import { type ElTableRowScope } from "@pages/element-ui/table"
import weekHelper from "@service/components/week-helper"
import { isEffective } from "@util/limit"
import { useLocalStorage } from "@vueuse/core"
import { ElSwitch, ElTable, ElTableColumn, ElTag, type Sort } from "element-plus"
import { defineComponent } from "vue"
import { useLimitTable } from "../context"
import LimitOperationColumn from "./column/LimitOperationColumn"
import RuleContent from "./RuleContent"
import Waste from "./Waste"
import Weekday from "./Weekday"

export type LimitSortProp = keyof Pick<timer.limit.Item, 'name' | 'weekdays' | 'waste' | 'weeklyWaste'>

const DEFAULT_SORT_COL = 'waste'

const sortMethodByNumVal = (key: keyof timer.limit.Item & 'waste' | 'weeklyWaste'): (a: timer.limit.Item, b: timer.limit.Item) => number => {
    return ({ [key]: a }: timer.limit.Item, { [key]: b }: timer.limit.Item) => (a ?? 0) - (b ?? 0)
}

const sortByEffectiveDays = ({ weekdays: a }: timer.limit.Item, { weekdays: b }: timer.limit.Item) => (a?.length ?? 0) - (b?.length ?? 0)

const _default = defineComponent(() => {
    const { data: weekStartName } = useRequest(async () => {
        const offset = await weekHelper.getRealWeekStart()
        const name = t(msg => msg.calendar.weekDays)?.split('|')?.[offset]
        return name || 'NaN'
    })

    const {
        list,
        changeEnabled, changeDelay, changeLocked
    } = useLimitTable()

    const historySort = useLocalStorage<Sort>('__limit_sort_default__', { prop: DEFAULT_SORT_COL, order: 'descending' })

    return () => (
        <ElTable
            border fit highlightCurrentRow
            style={{ width: "100%" }}
            data={list.value}
            defaultSort={historySort.value}
            onSort-change={(val: Sort) => historySort.value = { prop: val?.prop, order: val?.order }}
        >
            <ElTableColumn type="selection" align="center" fixed="left" />
            <ElTableColumn
                prop='name'
                label={t(msg => msg.limit.item.name)}
                minWidth={120}
                align="center"
                formatter={({ name }: timer.limit.Item) => name || '-'}
                fixed
                sortable
                sortBy={(row: timer.limit.Item) => row.name}
            />
            <ElTableColumn
                label={t(msg => msg.limit.item.condition)}
                minWidth={180}
                align="center"
                formatter={({ cond }: timer.limit.Item) => <>{cond?.map?.(c => <span style={{ display: "block" }}>{c}</span>) || ''}</>}
            />
            <ElTableColumn
                label={t(msg => msg.limit.item.detail)}
                minWidth={200}
                align="center"
            >
                {({ row }: ElTableRowScope<timer.limit.Item>) => <RuleContent value={row} />}
            </ElTableColumn>
            <ElTableColumn
                prop='effectiveDays'
                label={t(msg => msg.limit.item.effectiveDay)}
                minWidth={170}
                align="center"
                sortable
                sortMethod={sortByEffectiveDays}
            >
                {({ row: { weekdays } }: ElTableRowScope<timer.limit.Item>) => <Weekday value={weekdays} />}
            </ElTableColumn>
            <ElTableColumn
                prop={DEFAULT_SORT_COL}
                sortable
                sortMethod={sortMethodByNumVal('waste')}
                label={t(msg => msg.calendar.range.today)}
                minWidth={90}
                align="center"
            >
                {({ row }: ElTableRowScope<timer.limit.Item>) => isEffective(row.weekdays) ? (
                    <Waste
                        waste={row.waste}
                        time={row.time}
                        count={row.count}
                        visit={row.visit}
                        allowDelay={row.allowDelay}
                        delayCount={row.delayCount}
                    />
                ) : (
                    <ElTag type="info" size="small">
                        {t(msg => msg.limit.item.notEffective)}
                    </ElTag>
                )}
            </ElTableColumn>
            <ElTableColumn
                prop='weeklyWaste'
                minWidth={110}
                align="center"
                sortable
                sortMethod={sortMethodByNumVal('weeklyWaste')}
                v-slots={{
                    header: () => (
                        <ColumnHeader
                            label={t(msg => msg.calendar.range.thisWeek)}
                            tooltipContent={t(msg => msg.limit.item.weekStartInfo, { weekStart: weekStartName.value })}
                        />
                    ),
                    default: ({ row: {
                        weeklyWaste, weekly,
                        weeklyVisit, weeklyCount,
                        weeklyDelayCount, allowDelay,
                    } }: ElTableRowScope<timer.limit.Item>) => (
                        <Waste
                            time={weekly}
                            waste={weeklyWaste}
                            count={weeklyCount}
                            visit={weeklyVisit}
                            allowDelay={allowDelay}
                            delayCount={weeklyDelayCount}
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
                    {({ row }: ElTableRowScope<timer.limit.Item>) => (
                        <ElSwitch size="small" modelValue={row.enabled} onChange={v => changeEnabled(row, !!v)} />
                    )}
                </ElTableColumn>
                <ElTableColumn
                    label={t(msg => msg.limit.item.delayAllowed)}
                    minWidth={80}
                    align="center"
                    fixed="right"
                >
                    {({ row }: ElTableRowScope<timer.limit.Item>) => (
                        <ElSwitch size="small" modelValue={row.allowDelay} onChange={v => changeDelay(row, !!v)} />
                    )}
                </ElTableColumn>
                <ElTableColumn
                    label={t(msg => msg.limit.item.locked)}
                    minWidth={80}
                    align="center"
                    fixed="right"
                >
                    {({ row }: ElTableRowScope<timer.limit.Item>) => (
                        <ElSwitch size="small" modelValue={row.locked} onChange={v => changeLocked(row, !!v)} />
                    )}
                </ElTableColumn>
            </ElTableColumn>
            <LimitOperationColumn />
        </ElTable>
    )
})

export default _default