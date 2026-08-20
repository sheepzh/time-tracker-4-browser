import siteDatabase from '@db/site-database'
import { ClassicSiteDatabase } from '@db/site-database/classic'
import whitelistDatabase from '@db/whitelist-database'
import siteHolder from '@service/site-service/holder'
import { EXCLUDING_PREFIX } from '@util/constant/remain-host'
import { judgeVirtualFast } from '@util/pattern'
import { SiteMap } from '@util/site'
import { Migrator } from './types'

export default class SiteMigrator implements Migrator {
    onInstall(): void {
    }

    async onUpdate(_version: string): Promise<void> {
        await this.#migrateSite2Idb()
        await this.#migrateWhitelist()
    }

    async #migrateSite2Idb() {
        const classic = new ClassicSiteDatabase()
        const all = await classic.select()
        await siteDatabase.save(...all)
        await classic.remove(all)
        all.forEach(s => siteHolder.buildWith(s))
    }

    async #migrateWhitelist() {
        const whitelist = await whitelistDatabase.selectAll()
        const siteWhite = new SiteMap<boolean>()
        for (const white of whitelist) {
            if (white.startsWith(EXCLUDING_PREFIX)) {
                const host = white.substring(EXCLUDING_PREFIX.length)
                if (!judgeVirtualFast(host)) continue
                siteWhite.put({ host, type: 'virtual' }, false)
            } else {
                siteWhite.put({
                    host: white,
                    type: judgeVirtualFast(white) ? 'virtual' : 'normal',
                }, true)
            }
        }
        const keys = siteWhite.keys()
        const values = await siteDatabase.getBatch(keys)
        const map = SiteMap.identify(values)
        const toSave: tt4b.site.SiteInfo[] = keys.map(key => {
            const white = siteWhite.get(key) ?? undefined
            const value = map.get(key) ?? { ...key }
            return { ...value, options: { ...value.options, white } }
        })
        await siteDatabase.save(...toSave)
        toSave.forEach(s => siteHolder.buildWith(s))

        await whitelistDatabase.clear()
    }
}