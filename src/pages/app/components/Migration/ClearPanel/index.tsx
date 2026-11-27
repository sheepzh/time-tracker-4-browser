/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type StatDay } from '@/shared/day'
import { batchDeleteStats, listGroupStats, listSiteStats } from "@api/sw/stat"
import { t } from "@app/locale"
import { useDayOffset } from '@hooks'
import { cvt2LocaleDate, MILL_PER_SECOND } from "@pages/util/time"
import { BIRTH_DATE } from '@util/time'
import { ElCard, ElMessage, ElMessageBox } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import { useDataMemory } from "../context"
import DataManageAlert from '../DataManageAlert'
import ClearFilter, { type FilterOption } from "./ClearFilter"

function buildClearStatQuery(option: FilterOption, today: StatDay): tt4b.stat.BaseQuery {
    const { date, focus, visit } = option
    const focusMax = str2Num(focus, MILL_PER_SECOND)
    const visitMax = str2Num(visit)
    return {
        date: cvt2LocaleDate(date ?? today.rangeTo(BIRTH_DATE)),
        focusRange: [, focusMax],
        timeRange: [, visitMax],
    }
}

const str2Num = (str: string | undefined, multiplier?: number): number | undefined => {
    if (!str) return undefined
    let num = Number(str)
    if (isNaN(num)) return undefined
    return multiplier !== undefined ? num * multiplier : num
}

const _default = defineComponent<{}>(() => {
    const { refreshMemory } = useDataMemory()
    const { today } = useDayOffset()
    const onDelete = async (option: FilterOption) => {
        const q = buildClearStatQuery(option, today.value)
        if (!q) return ElMessage.warning("Param error")
        const siteRows = await listSiteStats({ ...q, virtual: true, remote: false })
        const groupRows = await listGroupStats(q)

        const count = siteRows.length + groupRows.length
        if (!count) return

        const confirmMsg = t(msg => msg.dataManage.deleteConfirm, { count })
        ElMessageBox.confirm(confirmMsg, {
            cancelButtonText: t(msg => msg.button.cancel),
            confirmButtonText: t(msg => msg.button.confirm),
        }).then(async () => {
            await batchDeleteStats([...siteRows, ...groupRows])
            ElMessage.success(t(msg => msg.operation.successMsg))
            refreshMemory?.()
        }).catch(() => { })
    }

    return () => (
        <ElCard style={{ width: '100%' } satisfies StyleValue}>
            <DataManageAlert text={msg => msg.dataManage.operationAlert} />
            <ClearFilter onDelete={onDelete} />
        </ElCard>
    )
})

export default _default