/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"

const MERGED_FLAG = 'm'
const VIRTUAL_FLAG = 'v'
const NONE_FLAG = '_'

/**
 * site key => option value
 */
export function cvt2OptionValue(siteKey: timer.site.SiteKey | undefined): string {
    if (!siteKey) return ''
    const { type } = siteKey
    let flag = NONE_FLAG
    type === 'merged' && (flag = MERGED_FLAG)
    type === 'virtual' && (flag = VIRTUAL_FLAG)
    return `${flag}${siteKey.host}`
}

/**
 * option value => site key
 */
export function cvt2SiteKey(optionValue: string): timer.site.SiteKey {
    const flag = optionValue.substring(0, 1)
    const host = optionValue.substring(1)
    if (flag === MERGED_FLAG) {
        return { host, type: 'merged' }
    } else if (flag === VIRTUAL_FLAG) {
        return { host, type: 'virtual' }
    } else {
        return { host, type: 'normal' }
    }
}

export const EXIST_MSG = t(msg => msg.siteManage.msg.existedTag)
export const MERGED_MSG = t(msg => msg.siteManage.type.merged?.name)?.toLocaleUpperCase?.()
export const VIRTUAL_MSG = t(msg => msg.siteManage.type.virtual?.name)?.toLocaleUpperCase?.()

/**
 * Calculate the label of alias key to display
 *
 * @returns
 *      1. www.google.com
 *      2. www.google.com[MERGED]
 *      4. www.google.com[EXISTED]
 *      5. www.github.com/sheepzh/*[VIRTUAL]
 *      5. www.github.com/sheepzh/*[VIRTUAL-EXISTED]
 *      3. www.google.com[MERGED-EXISTED]
 */
export function labelOf(siteKey: timer.site.SiteKey, exists?: boolean): string {
    let { host: label, type } = siteKey || {}
    const suffix: string[] = []
    type === 'merged' && suffix.push(MERGED_MSG)
    type === 'virtual' && suffix.push(VIRTUAL_MSG)
    exists && suffix.push(EXIST_MSG)
    suffix.length && (label += `[${suffix.join('-')}]`)
    return label
}

export const ALL_TYPES: timer.site.Type[] = ['normal', 'merged', 'virtual']