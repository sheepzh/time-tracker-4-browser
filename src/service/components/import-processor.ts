/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import statDatabase from "@db/stat-database"
import { isNotZeroResult } from "@util/stat"

/**
 * Process imported data from other extensions of remote
 *
 * @since 1.9.2
 */
export async function processImportedData(data: timer.imported.Data, resolution: timer.imported.ConflictResolution): Promise<void> {
    if (resolution === 'overwrite') {
        return processOverwrite(data)
    } else {
        return processAcc(data)
    }
}

async function processOverwrite(data: timer.imported.Data): Promise<void> {
    const { rows, focus, time } = data
    await Promise.all(rows.map(async row => {
        const { host, date } = row
        const exist = await statDatabase.get(host, date)
        focus && (exist.focus = row.focus || 0)
        time && (exist.time = row.time || 0)
        await statDatabase.forceUpdate({ ...exist, host, date })
    }))
}

async function processAcc(data: timer.imported.Data): Promise<void> {
    const { rows } = data
    await Promise.all(rows.map(async row => {
        const { host, date, focus = 0, time = 0 } = row
        await statDatabase.accumulate(host, date, { focus, time })
    }))
}

export async function fillExist(rows: timer.imported.Row[]): Promise<void> {
    await Promise.all(rows.map(async row => {
        const { host, date } = row
        const exist = await statDatabase.get(host, date)
        isNotZeroResult(exist) && (row.exist = exist)
    }))
}