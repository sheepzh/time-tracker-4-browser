/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"

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

export type RingValue = [
    current?: number,
    last?: number,
]

/**
 * Compute ring text
 *
 * @param ring ring value
 * @param formatter formatter
 * @returns text or '-'
 */
export function computeRingText(ring: RingValue, formatter?: ValueFormatter): string | undefined {
    const [current, last] = ring
    if (current === undefined && last === undefined) {
        // return undefined if both are undefined
        return undefined
    }
    const delta = (current ?? 0) - (last ?? 0)
    let result = formatter ? formatter(delta) : delta?.toString()
    delta >= 0 && (result = '+' + result)
    return result
}

export type ValueFormatter = (val: number | undefined) => string

export const formatValue = (val: number | undefined, formatter?: ValueFormatter) => formatter ? formatter(val) : val?.toString() || '-'

export type DimensionEntry = {
    date: string
    value: number
}