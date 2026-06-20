import { getGroup } from "@api/chrome/tabGroups"
import {
    batchDeleteStats, countGroupStatsByIds, countSiteStatsByHosts, deleteSiteStatByGroup, deleteSiteStatByHost,
} from "@api/sw/stat"
import { type I18nKey, t } from '@app/locale'
import { DeleteFilled } from "@element-plus/icons-vue"
import { isGroup, isNormalSite, isSite } from "@util/stat"
import { cvtDateRange2Str, formatTime, getBirthday } from "@util/time"
import { ElButton, ElMessage, ElMessageBox } from "element-plus"
import { computed, defineComponent } from "vue"
import { useRecordComponent, useRecordFilter } from "../context"
import type { DisplayComponent, RecordFilterOption } from "../types"

async function extractExample(hostExample: string | undefined, groupIdExample: number | undefined): Promise<string> {
    if (hostExample) return hostExample
    if (groupIdExample) {
        const group = await getGroup(groupIdExample)
        return group?.title ?? `ID:${groupIdExample}`
    }
    // Never happen
    return 'NaN'
}

async function computeBatchDeleteMsg(selected: tt4b.stat.Row[], mergeDate: boolean, dateRange: [number?, number?]): Promise<string> {
    const hosts: string[] = []
    const groupIds: number[] = []
    selected.forEach(row => {
        isSite(row) && hosts.push(row.siteKey.host)
        isGroup(row) && groupIds.push(row.groupKey)
    })
    const example = await extractExample(hosts[0], groupIds[0])
    let count2Delete = selected.length
    if (mergeDate) {
        // All the items
        const date = cvtDateRange2Str(dateRange) ?? []
        const siteCount = hosts.length ? await countSiteStatsByHosts(hosts, date) : 0
        const groupCount = groupIds.length ? await countGroupStatsByIds(groupIds, date) : 0
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
    if (startDate === undefined && endDate === undefined) {
        // Delete all
        key = msg => msg.record.batchDelete.confirmMsgAll
    } else {
        const dateFormat = t(msg => msg.calendar.dateFormat)
        const start = formatTime(startDate ?? getBirthday(), dateFormat)
        const end = formatTime(endDate ?? Date.now(), dateFormat)
        if (start === end) {
            // Single date
            key = msg => msg.record.batchDelete.confirmMsg
            i18nParam.date = start
        } else {
            // Date range
            key = msg => msg.record.batchDelete.confirmMsgRange
            i18nParam.start = start
            i18nParam.end = end
        }
    }
    return t(key, i18nParam)
}

async function handleBatchDelete(displayComp: DisplayComponent | undefined, filter: RecordFilterOption) {
    if (!displayComp) return

    const selected = displayComp?.getSelected?.()
    if (!selected?.length) return ElMessage.info("No item selected")
    const { dateRange, mergeDate } = filter
    ElMessageBox({
        message: await computeBatchDeleteMsg(selected, mergeDate, dateRange),
        type: "warning",
        confirmButtonText: t(msg => msg.button.okay),
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

async function deleteBatch(selected: tt4b.stat.Row[], mergeDate: boolean, dateRange: [number?, number?]) {
    if (mergeDate) {
        // Delete according to the date range
        const date = cvtDateRange2Str(dateRange)
        for (const row of selected) {
            isNormalSite(row) && await deleteSiteStatByHost(row.siteKey.host, date)
            isGroup(row) && await deleteSiteStatByGroup(row.groupKey, date)
        }
    } else {
        // If not merge date, batch delete
        await batchDeleteStats(selected)
    }
}

const BatchDelete = defineComponent<{}>(() => {
    const filter = useRecordFilter()
    const disabled = computed(() => {
        const { siteMerge } = filter
        return !!siteMerge && siteMerge !== 'group'
    })
    const comp = useRecordComponent()

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