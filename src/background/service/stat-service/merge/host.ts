import mergeRuleDatabase from "@db/merge-rule-database"
import CustomizedHostMergeRuler from "@service/components/host-merge-ruler"
import { mergeResult } from "./common"

export async function mergeHost(origin: tt4b.stat.SiteRow[]): Promise<tt4b.stat.SiteRow[]> {
    const map: Record<string, MakeRequired<tt4b.stat.SiteRow, 'mergedRows'>> = {}

    // Generate ruler
    const mergeRuleItems = await mergeRuleDatabase.selectAll()
    const mergeRuler = new CustomizedHostMergeRuler(mergeRuleItems)

    origin.forEach(ele => {
        const { siteKey: { host, type }, date } = ele
        if (type !== 'normal') return
        let mergedHost = mergeRuler.merge(host)
        const key = date + mergedHost
        const exist = map[key] ?? (map[key] = {
            siteKey: { type: 'merged', host: mergedHost },
            date,
            focus: 0,
            time: 0,
            mergedRows: [],
            composition: { focus: [], time: [] },
        } satisfies tt4b.stat.Row)
        mergeResult(exist, ele)
        exist.mergedRows.push(ele)
    })
    return Object.values(map)
}