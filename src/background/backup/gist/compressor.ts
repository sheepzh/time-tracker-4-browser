import { groupBy } from "@util/array"

function calcGroupKey(row: timer.stat.RowBase): string {
    const date = row.date
    if (!date) {
        return undefined
    }
    return date.substring(0, 6)
}

/**
 * Compress row array to gist row
 * 
 * @param rows row array
 */
function compress(rows: timer.stat.RowBase[]): GistData {
    const result: GistData = groupBy(
        rows,
        row => row.date.substring(6),
        groupedRows => {
            const gistRow: GistRow = {}
            groupedRows.forEach(({ host, focus, total, time }) => gistRow[host] = [time, focus, total])
            return gistRow
        }
    )
    return result
}

/**
 * Divide rows to buckets
 * 
 * @returns [bucket, data][]
 */
export function devide2Buckets(rows: timer.stat.RowBase[]): [string, GistData][] {
    const grouped: { [yearAndPart: string]: GistData } = groupBy(rows, calcGroupKey, compress)
    return Object.entries(grouped)
}

/**
 * Gist data 2 rows
 * 
 * @param filename filename
 * @param gistData gistData
 * @returns rows
 */
export function gistData2Rows(filename: string, gistData: GistData): timer.stat.RowBase[] {
    const result = []
    const yearMonth = filename.substring(0, 6)
    Object.entries(gistData).forEach(([dateOfMonth, gistRow]) => {
        const date = yearMonth + dateOfMonth
        Object.entries(gistRow).forEach(([host, val]) => {
            const [time, focus, total] = val
            const row: timer.stat.RowBase = {
                date,
                host,
                time, focus, total
            }
            result.push(row)
        })
    })
    return result
}