import db from "@db/site-database"
import { compileAntPattern } from '@util/pattern'

/**
 * The singleton implementation of virtual sites holder
 *
 * @since 1.6.0
 */
class VirtualSiteHolder {
    hostRegMap: Record<string, RegExp> = {}

    constructor() {
        db.select().then(keys => keys.forEach(key => this.buildWith(key)))
    }

    buildWith({ host, type }: timer.site.SiteKey) {
        if (type !== 'virtual') return
        this.hostRegMap[host] = compileAntPattern(host)
    }

    onDeleted({ host, type }: timer.site.SiteKey) {
        if (type !== 'virtual') return
        delete this.hostRegMap[host]
    }

    /**
     * Find the virtual sites which matches the target url
     *
     * @param url
     * @returns virtual sites
     */
    findMatched(url: string): string[] {
        return Object.entries(this.hostRegMap)
            .filter(([_, reg]) => reg.test(url))
            .map(([k]) => k)
    }
}

export default new VirtualSiteHolder()