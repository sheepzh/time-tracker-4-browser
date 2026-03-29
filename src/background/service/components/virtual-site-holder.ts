import siteDatabase from "@db/site-database"
import { compileAntPattern } from '@util/pattern'

/**
 * The singleton implementation of virtual sites holder
 *
 * @since 1.6.0
 */
class VirtualSiteHolder {
    hostSiteRegMap: Record<string, RegExp> = {}

    constructor() {
        siteDatabase.select().then(sitesInfos => sitesInfos
            .filter(s => s.type === 'virtual')
            .forEach(site => this.updateRegularExp(site))
        )
        siteDatabase.addChangeListener(oldAndNew => oldAndNew.forEach(([oldVal, newVal]) => {
            if (!newVal) {
                // deleted
                oldVal?.host && delete this.hostSiteRegMap[oldVal.host]
            } else {
                this.updateRegularExp(newVal)
            }
        }))
    }

    private updateRegularExp(siteInfo: timer.site.SiteInfo) {
        const { host } = siteInfo
        this.hostSiteRegMap[host] = compileAntPattern(host)
    }

    /**
     * Find the virtual sites which matches the target url
     *
     * @param url
     * @returns virtual sites
     */
    findMatched(url: string): string[] {
        return Object.entries(this.hostSiteRegMap)
            .filter(([_, reg]) => reg.test(url))
            .map(([k]) => k)
    }
}

export default new VirtualSiteHolder()