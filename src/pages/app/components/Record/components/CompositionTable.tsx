/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from '@app/locale'
import { sum } from "@util/array"
import { ElTable, ElTableColumn } from "element-plus"
import { type FunctionalComponent } from "vue"

type Row = {
    name: string
    value: number
    percent?: string
}

const CLIENT_NAME = t(msg => msg.record.remoteReading.table.client)
const VALUE = t(msg => msg.record.remoteReading.table.value)
const LOCAL_DATA = t(msg => msg.record.remoteReading.table.localData)
const PERCENTAGE = t(msg => msg.record.remoteReading.table.percentage)

function computeRows(data: tt4b.stat.RemoteCompositionVal[]): Row[] {
    const rows: Row[] = data.map(e => typeof e === 'number'
        ? { name: LOCAL_DATA, value: e || 0 }
        : { name: e.cname || e.cid, value: e.value }
    )
    const total = sum(rows.map(row => row.value))
    total && rows.forEach(row => row.percent = (row.value / total * 100).toFixed(2) + ' %')
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
                label={CLIENT_NAME}
                formatter={({ name }: Row) => name}
                align="center"
                width={150}
            />
            <ElTableColumn
                label={VALUE}
                formatter={({ value }: Row) => formatter?.(value) ?? String(value)}
                align="center"
                width={150}
            />
            <ElTableColumn
                label={PERCENTAGE}
                align="center"
                formatter={({ percent }: Row) => percent ?? ''}
                width={100}
            />
        </ElTable>
    </div>
)

export default CompositionTable