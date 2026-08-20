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
class SiteHolder {
    #virtualMap = new Map<string, DataNode>()
    #whitelist = new Map<string, tt4b.site.SiteInfo>()

    constructor() {
        db.select().then(sites => sites.forEach(site => this.buildWith(site)))
    }

    buildWith(site: tt4b.site.SiteInfo) {
        const { host, type, options } = site
        if (type === 'virtual') {
            const reg = compileAntPattern(host)
            this.#virtualMap.set(host, { reg, site })
        } else if (type === 'normal') {
            if (options?.white) {
                this.#whitelist.set(host, { ...site })
            } else {
                this.#whitelist.delete(host)
            }
        }
    }

    onDeleted({ host, type }: tt4b.site.SiteKey) {
        if (type === 'virtual') {
            this.#virtualMap.delete(host)
        } else if (type === 'normal') {
            this.#whitelist.delete(host)
        }
    }

    /**
     * Find the virtual sites which matches the target url
     *
     * @param url
     * @returns virtual sites
     */
    matchVirtual(url: string): tt4b.site.SiteInfo[] {
        return Array.from(this.#virtualMap.values())
            .filter(({ reg }) => reg.test(url))
            .map(({ site }) => site)
    }

    /**
     * 1. if any matched virtual sites is not white, return false
     * 2. if this host is white, return true
     * 3. if any matched virtual sites is white, return true
     * 4. or return false
     */
    isWhitelist(host: string, url: string): boolean {
        const virtualSites = this.matchVirtual(url)
        for (const virtual of virtualSites) {
            if (!virtual.options?.white) return false
        }
        const hostWhite = this.#whitelist.get(host)?.options?.white
        if (hostWhite) return true
        return virtualSites.length > 0
    }
}

const siteHolder = new SiteHolder()

export default siteHolder