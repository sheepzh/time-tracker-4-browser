/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { groupBy } from "@util/array"
import { formatPeriodCommon } from "@util/time"

export const CLIENT_FILE_NAME = "clients_no_modify.md"

const CLIENT_FIELDS: MarkdownTableField<timer.backup.Client>[] = [
    {
        name: "Client Id",
        formatter: r => r.id,
    }, {
        name: "Client Name",
        formatter: r => r.name,
    }, {
        name: "Earliest Date",
        formatter: r => r.minDate ?? '',
    }, {
        name: "Latest Date",
        formatter: r => r.maxDate ?? '',
    }
]

type Meta = {
    version: number
    ts: number
}

const CURRENT_VER = 1

function genMetaLine(): string {
    const meta: Meta = { version: CURRENT_VER, ts: Date.now() }
    return genJsonLine(meta)
}

function genJsonLine(data: any): string {
    return `<!-- ${JSON.stringify(data)} -->`
}

export function convertClients2Markdown(clients: timer.backup.Client[]): string {
    return genMarkdownTable(clients, CLIENT_FIELDS)
}

type CellFormatter<T> = string | number | ((row: T) => string | number)

type MarkdownTableField<T> = {
    name: string
    formatter: CellFormatter<T>
}

function genTableRow<T>(t: T, formatters: CellFormatter<T>[]): string {
    const cells = formatters?.map(f => {
        const str = typeof f === 'function'
            ? f?.(t)?.toString?.()?.replace('|', '&#124;')
            : f?.toString?.()
        return str ?? '-'
    })
    return `|${cells.join('|')}|`
}

function genMarkdownTable<T>(list: T[], fields: MarkdownTableField<T>[]): string {
    const lines: string[] = [
        genMetaLine(),
        genJsonLine(list),
    ]
    list = list || []
    fields = fields || []
    if (fields.length) {
        // header
        lines.push(genTableRow(null, fields.map(f => f.name)))
        lines.push(genTableRow(null, fields.map(_ => '----')))
        const cellFormatters = fields.map(f => f.formatter)
        lines.push(
            ...list.map(row => genTableRow(row, cellFormatters))
        )
    }
    return lines.join('\n')
}

const ROW_FIELDS: MarkdownTableField<timer.core.Row>[] = [
    {
        name: "Date",
        formatter: r => r.date,
    }, {
        name: "Domain/URL",
        formatter: r => r.host,
    }, {
        name: "Focus Time",
        formatter: r => formatPeriodCommon(r.focus || 0)
    }, {
        name: "Visit Count",
        formatter: r => r.time || 0,
    },
]

export function divideByDate(rows: timer.core.Row[]): { [date: string]: string } {
    return groupBy(rows, row => row.date, list => genMarkdownTable(list, ROW_FIELDS))
}

export function parseData<T>(markdown: string | undefined | null): T | undefined {
    if (!markdown) return undefined
    let line2 = markdown?.split('\n')?.[1]
    if (!line2) {
        return
    }
    line2 = line2?.replace("<!-- ", "").replace("-->", "").trim()
    if (!line2) return
    return JSON.parse(line2)
}