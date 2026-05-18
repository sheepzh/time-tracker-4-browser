import { judgeVirtualFast } from "@util/pattern"

export function cvt2SiteRow(rowBase: tt4b.core.Row): tt4b.stat.SiteRow {
    const { host, ...otherFields } = rowBase
    return {
        siteKey: { host, type: judgeVirtualFast(host) ? 'virtual' : 'normal' },
        ...otherFields,
    }
}