/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * Export csv file
 *
 * @param  titleAndData all rows
 * @param  fileName     file name
 * @since 0.0.7
 */
export function exportCsv(titleAndData: any[][], fileName: string) {
    const csv = titleAndData.map(row => row.reduce((a, b) => `${a},${b}`)).reduce((a, b) => `${a}\r\n${b}`)
    const blob = new Blob(['\ufeff' + csv], { type: "text/csv" })

    exportBlob(blob, fileName + '.csv')
}

/**
 * Export json file
 * @param data  data
 * @param fileName  the name of file
 * @since 0.0.7
 */
export function exportJson(data: any, fileName: string) {
    const jsonStr = JSON.stringify(data, null, 4)
    var blob = new Blob([jsonStr], { type: 'text/json' })

    exportBlob(blob, fileName + '.json')
}

/**
 * @param fileName  The name of file with suffix
 */
function exportBlob(blob: Blob, fileName: string) {
    const ele: HTMLElement = document.createElement("a")
    const link = ele as HTMLAreaElement
    link.href = URL.createObjectURL(blob)
    link.hidden = true
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Check json string and
 *
 * @param jsonStr json
 * @since 0.0.5
 */
export function deserialize(jsonStr: string): any | undefined {
    try {
        return JSON.parse(jsonStr)
    } catch {
        return undefined
    }
}