/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { mergeWith } from '@/util/stat'
import statDatabase from "@db/stat-database"
import backupProcessor from "../backup/processor"

export async function importOther(query: timer.imported.ProcessQuery): Promise<void> {
    const { data, resolution } = query
    if (resolution === 'overwrite') {
        return processOverwrite(data)
    }
    return processAcc(data)
}

async function processOverwrite(data: timer.imported.Data): Promise<void> {
    const { rows, focus, time } = data
    const exist = await statDatabase.batchSelect(rows)
    mergeWith(rows, exist, async (row, exist) => {
        focus && exist?.focus && (row.focus = exist.focus)
        time && exist?.time && (row.time = exist.time)
        await statDatabase.forceUpdate(row)
    })
}

async function processAcc(data: timer.imported.Data): Promise<void> {
    const { rows } = data
    await Promise.all(rows.map(async row => {
        const { host, date, focus = 0, time = 0 } = row
        await statDatabase.accumulate(host, date, { focus, time })
    }))
}


export async function previewBackup(param: timer.backup.RemoteQuery): Promise<timer.imported.Row[]> {
    const remoteRows = await backupProcessor.query(param)
    const rows: timer.imported.Row[] = remoteRows.map(rr => ({
        date: rr.date,
        host: rr.host,
        focus: rr.focus,
        time: rr.time,
    }))
    const exists = await statDatabase.batchSelect(rows)
    await mergeWith(rows, exists, (r, exist) => { r.exist = exist })
    return rows
}