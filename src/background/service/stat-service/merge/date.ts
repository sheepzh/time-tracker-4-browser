import { identifyTargetKey, isCate, isGroup, isNormalSite, isSite } from "@util/stat"
import { mergeResult } from "./common"

type MergeRow =
    | MakeRequired<tt4b.stat.SiteRow | tt4b.stat.CateRow, 'mergedDates' | 'mergedRows'>
    | MakeRequired<tt4b.stat.GroupRow, 'mergedDates' | 'mergedRows'>

export function mergeDate<T extends tt4b.stat.Row>(origin: T[]): T[] {
    const map: Record<string, MergeRow> = {}
    origin.forEach(ele => {
        const { date } = ele
        const key = identifyTargetKey(ele)
        const exist: MergeRow = map[key] ?? (map[key] = {
            ...ele,
            focus: 0,
            time: 0,
            mergedRows: [],
            mergedDates: [],
            composition: { focus: [], time: [], run: [] },
        })
        mergeResult(exist, ele)
        isSite(ele) && isSite(exist) && exist.mergedRows.push(...(ele.mergedRows ?? []))
        isCate(ele) && isCate(exist) && exist.mergedRows.push(...(ele.mergedRows ?? []))
        isGroup(ele) && isGroup(exist) && exist.mergedRows.push(...(ele.mergedRows ?? []))
        date && exist.mergedDates.push(date)
        if (isNormalSite(ele) && !isGroup(exist)) {
            const { mergedRows, ...toMerge } = ele
            exist.mergedRows.push(toMerge)
        }
    })
    const newRows = Object.values(map)
    return newRows as T[]
}