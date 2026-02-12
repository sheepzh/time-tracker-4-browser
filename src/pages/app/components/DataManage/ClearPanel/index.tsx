/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import db, { type StatCondition } from "@db/stat-database"
import { MILL_PER_DAY, MILL_PER_SECOND } from "@util/time"
import { ElCard, ElMessage, ElMessageBox } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import { useDataMemory } from "../context"
import DataManageAlert from '../DataManageAlert'
import ClearFilter from "./ClearFilter"

type FilterOption = {
    date: [Date, Date] | undefined
    focus: [string?, string?]
    time: [string?, string?]
}

async function generateParamAndSelect(option: FilterOption): Promise<timer.core.Row[]> {
    const param = checkParam(option)
    if (!param) {
        ElMessage.warning(t(msg => msg.dataManage.paramError))
        return []
    }

    const { date } = option
    let [dateStart, dateEnd] = date || []
    if (dateEnd == null) {
        // default end time is the yesterday
        dateEnd = new Date(new Date().getTime() - MILL_PER_DAY)
    }
    param.date = dateStart ? [dateStart, dateEnd] : undefined
    return await db.select(param)
}

/**
 * Assert query param with numeric range
 *
 * @param range       numeric range, 2-length array
 * @param mustInteger must be integer?
 * @returns true when has error, or false
 */
function assertQueryParam(range: [number, number?], mustInteger?: boolean): boolean {
    const reg = mustInteger ? /^[0-9]+$/ : /^[0-9]+.?[0-9]*$/
    const [start, end] = range || []
    const noStart = start !== undefined && start !== null
    const noEnd = end !== undefined && end !== null
    return (noStart && !reg.test(start.toString()))
        || (noEnd && !reg.test(end.toString()))
        || (noStart && noEnd && start > end)
}

const str2Num = (str: string | undefined) => str ? parseInt(str) : undefined
const seconds2Milliseconds = (a: number) => a * MILL_PER_SECOND

function checkParam(option: FilterOption): StatCondition | undefined {
    const { focus, time } = option
    let hasError = false
    const focusRange = str2Range(focus, seconds2Milliseconds) as [number, number]
    hasError = hasError || assertQueryParam(focusRange)
    const timeRange = str2Range(time)
    hasError = hasError || assertQueryParam(timeRange, true)
    if (hasError) {
        return undefined
    }
    const condition: StatCondition = {}
    condition.focusRange = focusRange
    condition.timeRange = timeRange
    return condition
}

function str2Range(startAndEnd: [string?, string?], numAmplifier?: (origin: number) => number): [number, number | undefined] {
    const startStr = startAndEnd[0]
    const endStr = startAndEnd[1]
    let start = str2Num(startStr) ?? 0
    numAmplifier && (start = numAmplifier(start))
    let end = str2Num(endStr)
    end && numAmplifier && (end = numAmplifier(end))
    return [start, end]
}

const _default = defineComponent(() => {
    const { refreshMemory } = useDataMemory()
    async function handleClick(option: FilterOption) {
        const result = await generateParamAndSelect(option)

        const count = result.length
        const confirmMsg = t(msg => msg.dataManage.deleteConfirm, { count })
        ElMessageBox.confirm(confirmMsg, {
            cancelButtonText: t(msg => msg.button.cancel),
            confirmButtonText: t(msg => msg.button.confirm)
        }).then(async () => {
            await db.delete(...result)
            ElMessage.success(t(msg => msg.operation.successMsg))
            refreshMemory?.()
        }).catch(() => { })
    }

    return () => (
        <ElCard style={{ width: '100%' } satisfies StyleValue}>
            <DataManageAlert text={msg => msg.dataManage.operationAlert} />
            <ClearFilter onDelete={(date, focus, time) => handleClick({ date, focus, time })} />
        </ElCard>
    )
})

export default _default