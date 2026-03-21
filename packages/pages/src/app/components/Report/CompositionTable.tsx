/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { sum } from "@util/array"
import { ElTable, ElTableColumn } from "element-plus"
import { computed, defineComponent, type PropType } from "vue"

type Row = {
    name: string
    value: number
    percent?: string
}

type ValueFormatter = (val: number) => string

const CLIENT_NAME = t(msg => msg.report.remoteReading.table.client)
const VALUE = t(msg => msg.report.remoteReading.table.value)
const LOCAL_DATA = t(msg => msg.report.remoteReading.table.localData)
const PERCENTAGE = t(msg => msg.report.remoteReading.table.percentage)

function computeRows(data: timer.stat.RemoteCompositionVal[]): Row[] {
    const rows: Row[] = data.map(e => typeof e === 'number'
        ? { name: LOCAL_DATA, value: e || 0 }
        : { name: e.cname || e.cid, value: e.value }
    )
    const total = sum(rows.map(row => row.value))
    total && rows.forEach(row => row.percent = (row.value / total * 100).toFixed(2) + ' %')
    rows.sort((a, b) => b.value - a.value)
    return rows
}

const formatValue = (value: number, valueFormatter?: ValueFormatter) => {
    if (valueFormatter) {
        return valueFormatter(value)
    }
    return value?.toString?.()
}

const _default = defineComponent({
    props: {
        data: {
            type: Array as PropType<timer.stat.RemoteCompositionVal[]>,
            required: true,
        },
        valueFormatter: Function as PropType<ValueFormatter>,
    },
    setup(props) {
        const rows = computed(() => computeRows(props.data))
        return () => (
            <div style={{ width: "400px" }}>
                <ElTable data={rows.value} size="small" border>
                    <ElTableColumn
                        label={CLIENT_NAME}
                        formatter={(r: Row) => r.name}
                        align="center"
                        width={150}
                    />
                    <ElTableColumn
                        label={VALUE}
                        formatter={(r: Row) => formatValue(r.value, props.valueFormatter)}
                        align="center"
                        width={150}
                    />
                    <ElTableColumn
                        label={PERCENTAGE}
                        align="center"
                        formatter={(r: Row) => r.percent ?? ''}
                        width={100}
                    />
                </ElTable>
            </div>
        )
    }
})

export default _default