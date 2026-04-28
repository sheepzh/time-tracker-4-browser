import type { LaunchContext } from "./base"

type RecordRow = {
    date: string
    url: string
    name: string
    category: string
    time: string
    runTime?: string
    visit: string
}

function readRecords(): RecordRow[] {
    const rows = document.querySelectorAll('.el-table .el-table__body-wrapper table tbody tr')
    return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td')
        const date = cells[1]?.textContent ?? ''
        const url = cells[2]?.textContent ?? ''
        const name = cells[3]?.textContent ?? ''
        const category = cells[4]?.textContent ?? ''
        const time = cells[5]?.textContent ?? ''
        let runTime: string | undefined = undefined, visit = ''
        if (cells?.length === 9) {
            // Including run time
            runTime = cells[6]?.textContent ?? undefined
            visit = cells[7]?.textContent ?? ''
        } else {
            visit = cells[6]?.textContent ?? ''
        }
        return { date, url, name, category, time, runTime, visit }
    })
}

export function parseTime2Sec(timeStr: string | undefined): number | undefined {
    if (!timeStr || timeStr === '-') return undefined
    const regRes = /^(\s*(?<hour>\d+)\s*h)?(\s*(?<min>\d+)\s*m)?(\s*(?<sec>\d+)\s*s)$/.exec(timeStr)
    if (!regRes) return NaN
    const { hour, min, sec } = regRes.groups || {}
    let res = parseInt(sec ?? '0')
    min && (res += 60 * parseInt(min))
    hour && (res += 3600 * parseInt(hour))
    return res
}

export async function readRecordsOfFirstPage(context: LaunchContext) {
    const recordPage = await context.openAppPage('/data/report')
    // At least one record
    await recordPage.waitForSelector('.el-table .el-table__body-wrapper table tbody tr td')
    let records = await recordPage.evaluate(readRecords)
    await recordPage.close()
    return records
}