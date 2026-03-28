import { judgeVirtualFast } from "@util/pattern"

export function cvt2SiteRow(rowBase: timer.core.Row): timer.stat.SiteRow {
    const { host, ...otherFields } = rowBase
    return {
        siteKey: { host, type: judgeVirtualFast(host) ? 'virtual' : 'normal' },
        ...otherFields,
    }
}