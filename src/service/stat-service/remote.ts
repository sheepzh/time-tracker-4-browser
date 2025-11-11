/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { StatCondition } from "@db/stat-database"
import processor from "@service/backup/processor"
import { identifyStatKey } from "@util/stat"
import { getBirthday } from "@util/time"
import { cvt2SiteRow } from "./common"

export async function processRemote(origin: timer.stat.SiteRow[], param?: StatCondition): Promise<timer.stat.SiteRow[]> {
    if (!await canReadRemote()) {
        return origin
    }
    // Map to merge
    const originMap: Record<string, MakeRequired<timer.stat.SiteRow, 'composition'>> = {}
    origin.forEach(row => originMap[identifyStatKey(row)] = {
        ...row,
        composition: {
            focus: [row.focus],
            time: [row.time],
            run: row.run ? [row.run] : [],
        }
    })
    // Predicate with host
    const { keys, date } = param ?? {}
    const keyArr = typeof keys === 'string' ? [keys] : keys
    const predicate = keyArr?.length
        ? ({ host }: timer.core.Row) => keyArr.includes(host)
        : () => true

    // 1. query remote
    let start: Date | undefined = undefined, end: Date | undefined = undefined
    if (Array.isArray(date)) {
        [start, end] = date
    } else {
        start = date
    }
    start = start ?? getBirthday()
    end = end ?? new Date()
    const remote = await processor.query({ excludeLocal: true, start, end })
    remote.filter(predicate).forEach(row => processRemoteRow(originMap, row))
    return Object.values(originMap)
}

/**
 * Enabled to read remote backup data
 *
 * @since 1.2.0
 * @returns T/F
 */
export async function canReadRemote(): Promise<boolean> {
    const { errorMsg } = await processor.checkAuth()
    return !errorMsg
}

function processRemoteRow(rowMap: Record<string, MakeRequired<timer.stat.SiteRow, 'composition'>>, remoteBase: timer.core.Row) {
    const row = cvt2SiteRow(remoteBase)
    const key = identifyStatKey(row)
    let exist = rowMap[key]
    !exist && (exist = rowMap[key] = {
        date: row.date,
        siteKey: row.siteKey,
        time: 0,
        focus: 0,
        composition: {
            focus: [],
            time: [],
            run: [],
        },
    } satisfies MakeRequired<timer.stat.SiteRow, 'composition'>)

    const { focus = 0, time = 0, run = 0, cid = '', cname } = row

    exist.focus += focus
    exist.time += time
    run && (exist.run = run)
    focus && exist.composition.focus.push({ cid, cname, value: focus })
    time && exist.composition.time.push({ cid, cname, value: time })
    run && exist.composition.run.push({ cid, cname, value: run })
}