import { toMap } from './array'
import { identifySiteKey } from "./site"

/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
export function isNotZeroResult(target: tt4b.core.Result): boolean {
    return !!target.focus || !!target.time
}

export function resultOf(focus: number, time: number): tt4b.core.Result {
    return { focus, time }
}

export const ALL_DIMENSIONS: tt4b.core.Dimension[] = ['focus', 'time']

export function identifyTargetKey(targetKey: tt4b.stat.TargetKey): string {
    if ('cateKey' in targetKey) {
        return `cate_${targetKey.cateKey}`
    } else if ('siteKey' in targetKey) {
        return identifySiteKey(targetKey.siteKey)
    } else {
        return `group_${targetKey.groupKey}`
    }
}

export function identifyStatKey(rowKey: tt4b.stat.StatKey) {
    const { date } = rowKey || {}

    return [identifyTargetKey(rowKey), date ?? ''].join('_')
}

export const isNormalSite = (row: tt4b.stat.Row): row is tt4b.stat.SiteRow => {
    return 'siteKey' in row && row.siteKey.type === 'normal'
}

export const isGroup = (row: tt4b.stat.StatKey): row is tt4b.stat.GroupRow => {
    return 'groupKey' in row
}

export const isSite = (row: tt4b.stat.StatKey): row is tt4b.stat.SiteRow => {
    return 'siteKey' in row
}

export const isCate = (row: tt4b.stat.StatKey): row is tt4b.stat.CateRow => {
    return 'cateKey' in row
}

export const getHost = (row: tt4b.stat.Row): string | undefined => {
    return 'siteKey' in row ? row.siteKey.host : undefined
}

export const getAlias = (row: tt4b.stat.Row): string | undefined => {
    return 'alias' in row ? row.alias : undefined
}

export const getIconUrl = (row: tt4b.stat.Row): string | undefined => {
    return 'iconUrl' in row ? row.iconUrl : undefined
}

export const getRelatedCateId = (row: tt4b.stat.Row): number | undefined => {
    if ('cateId' in row) return row.cateId
    if ('cateKey' in row) return row.cateKey
    return undefined
}

export const getComposition = (row: tt4b.stat.Row, dimension: tt4b.core.Dimension): tt4b.stat.RemoteCompositionVal[] => {
    return 'composition' in row ? row.composition?.[dimension] ?? [] : []
}

export const getGroupName = (groupMap: Record<string, chrome.tabGroups.TabGroup>, row: tt4b.stat.GroupRow): string => {
    const { groupKey } = row
    const title = groupMap[groupKey]?.title
    return title ?? `ID: ${groupKey}`
}

export const mergeWith = async <T extends tt4b.core.RowKey,>(
    original: T[], exist: tt4b.core.Row[],
    mergeFunc: (o: T, e: tt4b.core.Row | undefined) => Awaitable<void>,
) => {
    const keyOf = ({ date, host }: tt4b.core.RowKey) => `${date}${host}`
    const existMap = toMap(exist, keyOf)
    for (const o of original) {
        await mergeFunc(o, existMap[keyOf(o)])
    }
}