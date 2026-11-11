/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { ptFmt, t } from '@app/locale'
import { sum } from "@util/array"
import { ElTable, ElTableColumn } from "element-plus"
import { type FunctionalComponent } from "vue"

type Row = {
    name: string
    value: number
    percent?: string
}

function computeRows(data: tt4b.stat.RemoteCompositionVal[]): Row[] {
    const rows: Row[] = data.map(e => typeof e === 'number'
        ? { name: t(msg => msg.record.remoteReading.table.localData), value: e }
        : { name: e.cname ?? e.cid, value: e.value }
    )
    const total = sum(rows.map(row => row.value))
    const fmt = ptFmt(2)
    total && rows.forEach(row => row.percent = fmt.format(row.value / total))
    rows.sort((a, b) => b.value - a.value)
    return rows
}

type Props = {
    data: tt4b.stat.RemoteCompositionVal[]
    formatter?: (val: number) => string
}

const CompositionTable: FunctionalComponent<Props> = ({ data, formatter }) => (
    <div style={{ width: "400px" }}>
        <ElTable data={computeRows(data)} size="small" border>
            <ElTableColumn
                label={t(msg => msg.record.remoteReading.table.client)}
                formatter={({ name }: Row) => name}
                align="center"
                width={150}
            />
            <ElTableColumn
                label={t(msg => msg.record.remoteReading.table.value)}
                formatter={({ value }: Row) => formatter?.(value) ?? String(value)}
                align="center"
                width={150}
            />
            <ElTableColumn
                label={t(msg => msg.record.remoteReading.table.percentage)}
                align="center"
                formatter={({ percent }: Row) => percent ?? ''}
                width={100}
            />
        </ElTable>
    </div>
)

export default CompositionTable