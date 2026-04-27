import mergeRuleDatabase from "@db/merge-rule-database"
import CustomizedHostMergeRuler from "@service/components/host-merge-ruler"
import { isNormalSite } from "@util/stat"
import { mergeResult } from "./common"

export async function mergeHost(origin: timer.stat.SiteRow[]): Promise<timer.stat.SiteRow[]> {
    const map: Record<string, MakeRequired<timer.stat.SiteRow, 'mergedRows'>> = {}

    // Generate ruler
    const mergeRuleItems: timer.merge.Rule[] = await mergeRuleDatabase.selectAll()
    const mergeRuler = new CustomizedHostMergeRuler(mergeRuleItems)

    origin.forEach(ele => {
        if (!isNormalSite(ele)) return
        const { siteKey, date } = ele
        const { host } = siteKey
        let mergedHost = mergeRuler.merge(host)
        const key = (date ?? '') + mergedHost
        let exist = map[key]
        if (!exist) {
            exist = map[key] = {
                siteKey: { type: 'merged', host: mergedHost },
                date,
                focus: 0,
                time: 0,
                mergedRows: [],
                composition: { focus: [], time: [], run: [] },
            } satisfies timer.stat.Row
        }
        mergeResult(exist, ele)
        exist.mergedRows.push(ele)
    })
    return Object.values(map)
}