/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import type { ValueFormatter } from '../common/kanban/types'

/**
 * Transfer host info to label
 */
export function labelOfHostInfo(site: timer.site.SiteKey | undefined): string {
    if (!site) return ''
    const { host, type } = site
    if (!host) return ''
    let label = ''
    type === 'merged' && (label = `[${t(msg => msg.analysis.common.merged)}]`)
    type === 'virtual' && (label = `[${t(msg => msg.analysis.common.virtual)}]`)
    return `${host}${label}`
}


export const formatValue = (val: number | undefined, formatter?: ValueFormatter) => formatter ? formatter(val) : val?.toString() || '-'
