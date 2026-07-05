import db from "@db/site-database"
import { compileAntPattern } from '@util/pattern'

type DataNode = {
    reg: RegExp
    site: tt4b.site.SiteInfo
}

/**
 * The singleton implementation of virtual sites holder
 *
 * @since 1.6.0
 */
class VirtualSiteHolder {
    hostRegMap: Record<string, DataNode> = {}

    constructor() {
        db.select().then(keys => keys.forEach(key => this.buildWith(key)))
    }

    buildWith(site: tt4b.site.SiteInfo) {
        const { host, type } = site
        if (type !== 'virtual') return
        const reg = compileAntPattern(host)
        this.hostRegMap[host] = { reg, site }
    }

    onDeleted({ host, type }: tt4b.site.SiteKey) {
        if (type !== 'virtual') return
        delete this.hostRegMap[host]
    }

    /**
     * Find the virtual sites which matches the target url
     *
     * @param url
     * @returns virtual sites
     */
    findMatched(url: string): tt4b.site.SiteInfo[] {
        return Object.entries(this.hostRegMap)
            .filter(([_, { reg }]) => reg.test(url))
            .map(([_, { site }]) => site)
    }
}

export default new VirtualSiteHolder()