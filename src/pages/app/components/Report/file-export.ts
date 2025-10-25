/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey, t } from "@app/locale"
import { periodFormatter } from "@app/util/time"
import {
    exportCsv as exportCsv_,
    exportJson as exportJson_,
} from "@util/file"
import { CATE_NOT_SET_ID } from "@util/site"
import { getAlias, getGroupName, getHost, getRelatedCateId, isGroup } from "@util/stat"
import { formatTimeYMD } from "@util/time"
import type { ReportFilterOption } from "./types"

type ExportInfo = {
    host?: string
    group?: string
    date?: string
    alias?: string
    cate?: string
    focus?: string
    time?: number
}

/**
 * Compute the name of downloaded file
 */
function computeFileName(filterParam: ReportFilterOption): string {
    const { dateRange: [ds, de], siteMerge, mergeDate, timeFormat } = filterParam
    const parts = [
        t(msg => msg.report.exportFileName),
        ds && formatTimeYMD(ds),
        de && formatTimeYMD(de),
        mergeDate && t(msg => msg.shared.merge.mergeMethod.date),
        siteMerge && t(msg => msg.shared.merge.mergeMethod[siteMerge]),
        timeFormat && t(msg => msg.timeFormat[timeFormat]),
    ]
    return parts.filter(p => !!p).join('_')
}

const generateJsonData = ({ rows, categories, groupMap }: ExportParam): ExportInfo[] => rows.map(row => ({
    host: getHost(row) ?? undefined,
    group: isGroup(row) ? getGroupName(groupMap, row) : undefined,
    date: row.date,
    alias: getAlias(row),
    cate: getCateName(row, categories),
    focus: periodFormatter(row.focus, { format: 'second', hideUnit: true }),
    time: row.time
}))

const getCateName = (row: timer.stat.Row, categories: timer.site.Cate[]): string | undefined => {
    const cateId = getRelatedCateId(row)
    let cate: string | undefined = undefined
    if (cateId === CATE_NOT_SET_ID) {
        cate = t(msg => msg.shared.cate.notSet)
    } else if (cateId) {
        const current = categories?.find(c => c.id === cateId)
        cate = current?.name ?? ''
    }
    return cate
}

export type ExportParam = {
    rows: timer.stat.Row[]
    filter: ReportFilterOption
    categories: timer.site.Cate[]
    groupMap: Record<number, chrome.tabGroups.TabGroup>
}

/**
 * Export json data
 *
 * @param filterParam filter params
 * @param rows row data
 */
export function exportJson(param: ExportParam): void {
    const fileName = computeFileName(param.filter)
    const jsonData = generateJsonData(param)
    exportJson_(jsonData, fileName)
}

type CsvColumn = keyof ExportInfo

type CsvColumnConfig = {
    visible: (mergeDate: boolean, siteMerge: ReportFilterOption['siteMerge']) => boolean
    i18n: I18nKey
    formatter: (row: timer.stat.Row, categories: timer.site.Cate[], groupMap: Record<number, chrome.tabGroups.TabGroup>) => string
}

const CSV_COLUMN_CONFIGS: Record<CsvColumn, CsvColumnConfig> = {
    date: {
        visible: mergeDate => !mergeDate,
        i18n: msg => msg.item.date,
        formatter: row => row.date ?? '',
    },
    host: {
        visible: (_, siteMerge) => !siteMerge || siteMerge === 'domain',
        i18n: msg => msg.item.host,
        formatter: row => getHost(row) ?? '',
    },
    group: {
        visible: (_, siteMerge) => siteMerge === 'group',
        i18n: msg => msg.item.group,
        formatter: (row, _, groupMap) => isGroup(row) ? getGroupName(groupMap, row) : 'NaN'
    },
    alias: {
        visible: (_, siteMerge) => !siteMerge || siteMerge === 'domain',
        i18n: msg => msg.siteManage.column.alias,
        formatter: row => getAlias(row) ?? '',
    },
    cate: {
        visible: (_, siteMerge) => !siteMerge || siteMerge === 'cate',
        i18n: msg => msg.siteManage.column.cate,
        formatter: (row, categories) => getCateName(row, categories) ?? '',
    },
    focus: {
        visible: () => true,
        i18n: msg => msg.item.focus,
        formatter: row => periodFormatter(row.focus, { format: 'second', hideUnit: true }),
    },
    time: {
        visible: () => true,
        i18n: msg => msg.item.time,
        formatter: row => row.time?.toString?.() ?? '',
    },
}

function generateCsvData({ filter, rows, categories, groupMap }: ExportParam): string[][] {
    const { siteMerge, mergeDate } = filter

    const colConfigs = Object.values(CSV_COLUMN_CONFIGS).filter(({ visible }) => visible?.(mergeDate, siteMerge))

    const columnTitles = colConfigs.map(({ i18n }) => t(i18n))
    const lines = rows.map(row => colConfigs.map(({ formatter }) => formatter(row, categories, groupMap)))
    return [columnTitles, ...lines]
}

/**
 * Export csv data
 *
 * @param filterParam filter params
 * @param rows row data
 */
export function exportCsv(param: ExportParam): void {
    const fileName = computeFileName(param.filter)
    const csvData = generateCsvData(param)
    exportCsv_(csvData, fileName)
}