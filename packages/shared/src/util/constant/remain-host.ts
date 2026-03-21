/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * @since 0.7.0
 */
export const PDF_HOST = "__local_pdf__"
export const JSON_HOST = "__local_json__"
export const TXT_HOST = "__local_txt__"
export const PIC_HOST = "__local_picture__"

export const LOCAL_HOST_PATTERN = "__local_*__"
export const ALL_HOSTS = [PDF_HOST, JSON_HOST, TXT_HOST, PIC_HOST]
export const MERGED_HOST = "__local_files__"

export const SUFFIX_HOST_MAP: Record<string, string> = {
    txt: TXT_HOST,
    pdf: PDF_HOST,
    json: JSON_HOST,
    // Pictures
    jpg: PIC_HOST,
    img: PIC_HOST,
    png: PIC_HOST,
    jpeg: PIC_HOST,
}

const reg = /^__local_(.+)__$/
export function isRemainHost(host: string) {
    return reg.test(host)
}

export const EXCLUDING_PREFIX = '+'