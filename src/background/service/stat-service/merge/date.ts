import { identifyTargetKey, isCate, isGroup, isNormalSite, isSite } from "@util/stat"
import { mergeResult } from "./common"

export function mergeDate<T extends timer.stat.Row>(origin: T[]): T[] {
    const map: Record<
        string,
        | MakeRequired<timer.stat.SiteRow | timer.stat.CateRow, 'mergedDates' | 'mergedRows'>
        | MakeRequired<timer.stat.GroupRow, 'mergedDates'>
    > = {}
    origin.forEach(ele => {
        const { date } = ele
        const key = identifyTargetKey(ele)
        let exist = map[key]
        if (!exist) {
            exist = map[key] = {
                ...ele,
                focus: 0,
                time: 0,
                mergedRows: [],
                mergedDates: [],
                composition: { focus: [], time: [], run: [] },
            } satisfies timer.stat.Row
        }
        mergeResult(exist, ele)
        isSite(ele) && isSite(exist) && exist.mergedRows.push(...ele.mergedRows ?? [])
        isCate(ele) && isCate(exist) && exist.mergedRows.push(...ele.mergedRows ?? [])
        date && exist.mergedDates.push(date)
        if (isNormalSite(ele) && !isGroup(exist)) {
            const { mergedRows, ...toMerge } = ele
            exist.mergedRows.push(toMerge)
        }
    })
    const newRows = Object.values(map)
    return newRows as T[]
}