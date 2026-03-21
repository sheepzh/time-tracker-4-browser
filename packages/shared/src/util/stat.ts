import { identifySiteKey } from "./site"

/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
export function isNotZeroResult(target: timer.core.Result): boolean {
    return !!target.focus || !!target.time
}

export function resultOf(focus: number, time: number): timer.core.Result {
    return { focus, time }
}

export const ALL_DIMENSIONS: timer.core.Dimension[] = ['focus', 'time']

export function identifyTargetKey(targetKey: timer.stat.TargetKey): string {
    if ('cateKey' in targetKey) {
        return `cate_${targetKey.cateKey}`
    } else if ('siteKey' in targetKey) {
        return identifySiteKey(targetKey.siteKey)
    } else {
        return `group_${targetKey.groupKey}`
    }
}

export function identifyStatKey(rowKey: timer.stat.StatKey) {
    const { date } = rowKey || {}

    return [identifyTargetKey(rowKey), date ?? ''].join('_')
}

export const isNormalSite = (row: timer.stat.Row): row is timer.stat.SiteRow => {
    return 'siteKey' in row && row.siteKey.type === 'normal'
}

export const isMergedSite = (row: timer.stat.Row): row is timer.stat.SiteRow => {
    return 'siteKey' in row && row.siteKey.type === 'merged'
}

export const isGroup = (row: timer.stat.Row): row is timer.stat.GroupRow => {
    return 'groupKey' in row
}

export const isSite = (row: timer.stat.Row): row is timer.stat.SiteRow => {
    return 'siteKey' in row
}

export const isCate = (row: timer.stat.Row): row is timer.stat.CateRow => {
    return 'cateKey' in row
}

export const getHost = (row: timer.stat.Row): string | undefined => {
    return 'siteKey' in row ? row.siteKey.host : undefined
}

export const getAlias = (row: timer.stat.Row): string | undefined => {
    return 'alias' in row ? row.alias : undefined
}

export const getIconUrl = (row: timer.stat.Row): string | undefined => {
    return 'iconUrl' in row ? row.iconUrl : undefined
}

export const getRelatedCateId = (row: timer.stat.Row): number | undefined => {
    if ('cateId' in row) return row.cateId
    if ('cateKey' in row) return row.cateKey
    return undefined
}

export const getComposition = (row: timer.stat.Row, dimension: timer.core.Dimension): timer.stat.RemoteCompositionVal[] => {
    return 'composition' in row ? row.composition?.[dimension] ?? [] : []
}

export const getGroupName = (groupMap: Record<string, chrome.tabGroups.TabGroup>, row: timer.stat.GroupRow): string => {
    const { groupKey } = row
    const title = groupMap[groupKey]?.title
    return title ?? `ID: ${groupKey}`
}