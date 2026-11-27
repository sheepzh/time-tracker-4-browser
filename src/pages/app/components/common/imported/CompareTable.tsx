/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey, t } from "@app/locale"
import { useState } from "@hooks"
import { Box } from "@pages/components"
import { cvt2LocaleDate, fmtDur } from '@pages/util/time'
import { type Column, ElAutoResizer, ElTableV2, type SortBy, TableV2SortOrder } from "element-plus"
import { computed, defineComponent } from "vue"
import HostAlert from "../HostAlert"

type SortInfo = SortBy & {
    key: keyof tt4b.imported.Row
}

function computeList(sort: SortInfo, originRows: tt4b.imported.Row[]): tt4b.imported.Row[] {
    const { key, order } = sort
    if (!key) return originRows
    const factor = order === TableV2SortOrder.DESC ? -1 : 1
    return originRows.toSorted((a, b) => {
        const av = a[key] ?? 0, bv = b[key] ?? 0
        return av === bv ? 0 : factor * (av > bv ? 1 : -1)
    })
}

const focusCol = (comparedCol: I18nKey): Column[] => [
    {
        width: 150,
        align: 'center',
        title: t(comparedCol),
        cellRenderer: ({ rowData }) => <span>{fmtDur((rowData as tt4b.imported.Row).focus)}</span>,
    }, {
        width: 150,
        align: 'center',
        title: t(msg => msg.dataManage.importOther.local),
        cellRenderer: ({ rowData }) => <span>{fmtDur((rowData as tt4b.imported.Row).exist?.focus)}</span>,
    }
]

const timeCol = (comparedCol: I18nKey): Column[] => [
    {
        width: 150,
        align: 'center',
        title: t(comparedCol),
        cellRenderer: ({ rowData }) => <span>{(rowData as tt4b.imported.Row).time ?? 0}</span>,
    }, {
        width: 150,
        align: 'center',
        title: t(msg => msg.dataManage.importOther.local),
        cellRenderer: ({ rowData }) => <span>{(rowData as tt4b.imported.Row).exist?.time ?? '-'}</span>,
    }
]

type Props = {
    data: tt4b.imported.Data
    comparedCol: I18nKey
}

const BASE_COLUMNS: Column[] = [
    {
        align: 'center',
        width: 60,
        cellRenderer: ({ rowIndex }) => <span>{rowIndex + 1}</span>,
    }, {
        width: 120,
        dataKey: 'date' satisfies SortInfo['key'],
        sortable: true,
        align: 'center',
        title: t(msg => msg.item.date),
        cellRenderer: ({ rowData }) => <span>{cvt2LocaleDate((rowData as tt4b.imported.Row).date)}</span>,
    }, {
        width: 300,
        dataKey: 'host' satisfies SortInfo['key'],
        sortable: true,
        align: 'center',
        title: t(msg => msg.item.host),
        cellRenderer: ({ rowData }) => {
            const { host } = rowData as tt4b.imported.Row
            return host ? <HostAlert value={{ host, type: 'normal' }} clickable={false} /> : <></>
        },
    }
]

const _default = defineComponent<Props>((props) => {
    const [sort, setSort] = useState<SortInfo>({ order: TableV2SortOrder.ASC, key: 'date' })
    const list = computed(() => computeList(sort.value, props.data.rows))
    const columns = computed(() => {
        const value = [...BASE_COLUMNS]
        const { focus, time } = props.data
        focus && value.push(...focusCol(props.comparedCol))
        time && value.push(...timeCol(props.comparedCol))
        return value
    })

    return () => (
        <Box width="100%" height={400}>
            <ElAutoResizer v-slots={
                ({ width, height }: { width: number, height: number }) => (
                    <ElTableV2
                        height={height}
                        width={width}
                        sortBy={sort.value}
                        onColumnSort={({ key, order }) => setSort({ key: key as SortInfo['key'], order })}
                        data={list.value}
                        columns={columns.value}
                    />
                )
            } />
        </Box>
    )
}, { props: ['data', 'comparedCol'] })

export default _default