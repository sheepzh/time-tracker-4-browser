import { toMap } from "@util/array"
import { CATE_NOT_SET_ID } from "@util/site"
import { mergeResult } from "./common"

export function mergeCate(origin: tt4b.stat.SiteRow[], cates: tt4b.site.Cate[]): tt4b.stat.CateRow[] {
    const cateNameMap = toMap(cates, c => c.id, c => c.name)
    const rowMap: Record<string, MakeRequired<tt4b.stat.CateRow, 'mergedRows'>> = {}
    origin.forEach(ele => {
        if (ele.siteKey.type !== 'normal') return
        let { date = '', cateId = CATE_NOT_SET_ID } = ele
        const key = `${date}${cateId}`
        let exist = rowMap[key]
        if (!exist) {
            exist = rowMap[key] = {
                cateKey: cateId, date, cateName: cateNameMap[cateId],
                focus: 0,
                time: 0,
                mergedRows: [],
                composition: { focus: [], time: [], run: [] },
            } satisfies tt4b.stat.CateRow
        }
        mergeResult(exist, ele)
        exist.mergedRows.push(ele)
    })
    return Object.values(rowMap)
}