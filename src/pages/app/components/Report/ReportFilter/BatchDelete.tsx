import { getGroup } from "@api/chrome/tabGroups"
import { type I18nKey, t } from "@app/locale"
import statDatabase from "@db/stat-database"
import { DeleteFilled } from "@element-plus/icons-vue"
import { batchDelete, countGroupByIds, countSiteByHosts } from "@service/stat-service"
import { isGroup, isNormalSite, isSite } from "@util/stat"
import { formatTime, getBirthday } from "@util/time"
import { ElButton, ElMessage, ElMessageBox } from "element-plus"
import { computed, defineComponent } from "vue"
import { useReportComponent, useReportFilter } from "../context"
import type { DisplayComponent, ReportFilterOption } from "../types"

async function computeBatchDeleteMsg(selected: timer.stat.Row[], mergeDate: boolean, dateRange: [Date?, Date?]): Promise<string> {
    const hosts: string[] = []
    const groupIds: number[] = []
    selected.forEach(row => {
        isSite(row) && hosts.push(row.siteKey.host)
        isGroup(row) && groupIds.push(row.groupKey)
    })
    let example: string | undefined = hosts[0]
    if (!example) {
        const groupId = groupIds[0]
        const group = groupId ? await getGroup(groupId) : undefined
        example = group?.title ?? `ID:${groupId}`
    }
    if (!example) {
        // Never happen
        return t(msg => msg.report.batchDelete.noSelectedMsg)
    }
    let count2Delete = selected.length ?? 0
    if (mergeDate) {
        // All the items
        const siteCount = hosts.length ? await countSiteByHosts(hosts, dateRange) : 0
        const groupCount = groupIds.length ? await countGroupByIds(groupIds, dateRange) : 0
        count2Delete = siteCount + groupCount
    }
    const i18nParam: Record<string, string | number | undefined> = {
        // count
        count: count2Delete,
        // example for hosts
        example,
        // Start date, if range
        start: undefined,
        // End date, if range
        end: undefined,
        // Date, if single date
        date: undefined,
    }

    let key: I18nKey | undefined = undefined
    let [startDate, endDate] = dateRange
    if (!startDate && !endDate) {
        // Delete all
        key = msg => msg.report.batchDelete.confirmMsgAll
    } else {
        const dateFormat = t(msg => msg.calendar.dateFormat)
        startDate = startDate ?? getBirthday()
        endDate = endDate ?? new Date()
        const start = formatTime(startDate, dateFormat)
        const end = formatTime(endDate, dateFormat)
        if (start === end) {
            // Single date
            key = msg => msg.report.batchDelete.confirmMsg
            i18nParam.date = start
        } else {
            // Date range
            key = msg => msg.report.batchDelete.confirmMsgRange
            i18nParam.start = start
            i18nParam.end = end
        }
    }
    return t(key, i18nParam)
}

async function handleBatchDelete(displayComp: DisplayComponent | undefined, filter: ReportFilterOption) {
    if (!displayComp) return

    const selected = displayComp?.getSelected?.() ?? []
    if (!selected?.length) {
        ElMessage.info(t(msg => msg.report.batchDelete.noSelectedMsg))
        return
    }
    const { dateRange, mergeDate } = filter
    ElMessageBox({
        message: await computeBatchDeleteMsg(selected, mergeDate, dateRange),
        type: "warning",
        confirmButtonText: t(msg => msg.button.okey),
        showCancelButton: true,
        cancelButtonText: t(msg => msg.button.dont),
        // Cant close this on press ESC
        closeOnPressEscape: false,
        // Cant close this on clicking modal
        closeOnClickModal: false
    }).then(async () => {
        // Delete
        await deleteBatch(selected, mergeDate, dateRange)
        ElMessage.success(t(msg => msg.operation.successMsg))
        displayComp?.refresh?.()
    }).catch(() => {
        // Do nothing
    })
}

async function deleteBatch(selected: timer.stat.Row[], mergeDate: boolean, dateRange: [Date?, Date?]) {
    if (mergeDate) {
        // Delete according to the date range
        const [start, end] = dateRange ?? []
        for (const row of selected) {
            isNormalSite(row) && await statDatabase.deleteByHost(row.siteKey.host, [start, end])
            isGroup(row) && await statDatabase.deleteByGroup(row.groupKey, [start, end])
        }
    } else {
        // If not merge date, batch delete
        await batchDelete(selected)
    }
}

const BatchDelete = defineComponent(() => {
    const filter = useReportFilter()
    const disabled = computed(() => {
        const { siteMerge } = filter
        return !!siteMerge && siteMerge !== 'group'
    })
    const comp = useReportComponent()

    return () => (
        <ElButton
            v-show={!filter.readRemote}
            disabled={disabled.value}
            type="primary"
            link
            icon={DeleteFilled}
            onClick={() => handleBatchDelete(comp.value, filter)}
        >
            {t(msg => msg.button.batchDelete)}
        </ElButton>
    )
})

export default BatchDelete