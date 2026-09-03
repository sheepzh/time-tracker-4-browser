import cateDatabase from '@db/cate-database'
import { extractNamespace } from '@db/common/migratable'
import siteDatabase from '@db/site-database'
import type { BrowserMigratable } from '@db/types'
import {
    createArrayGuard, createObjectGuard, createOptionalGuard, createStringUnionGuard, isInt, isOptionalBoolean,
    isOptionalInt, isOptionalString, isString,
} from 'typescript-guard'
import { saveSite } from '.'

const isSiteInfo = createObjectGuard<tt4b.site.SiteInfo>({
    host: isString,
    type: createStringUnionGuard<tt4b.site.Type>('normal', 'merged', 'virtual'),
    alias: isOptionalString,
    iconUrl: isOptionalString,
    cate: isOptionalInt,
    options: createOptionalGuard(createObjectGuard<tt4b.site.Options>({
        white: isOptionalBoolean,
        run: isOptionalBoolean,
        media: isOptionalBoolean,
    })),
})

const isCate = createObjectGuard<tt4b.site.Cate>({
    id: isInt,
    name: isString,
})

const isSiteExportData = createObjectGuard<tt4b.site.ExportData>({
    categories: createArrayGuard(isCate),
    sites: createArrayGuard(isSiteInfo),
})

class SiteMigrator implements BrowserMigratable<'__site__'> {
    namespace = '__site__' as const

    async exportData(): Promise<tt4b.site.ExportData> {
        const categories = await cateDatabase.listAll()
        const sites = await siteDatabase.select()
        return { categories, sites }
    }

    async importData(data: unknown): Promise<void> {
        const siteData = extractNamespace(data, this.namespace, isSiteExportData)
        if (!siteData) return
        const { categories, sites } = siteData

        const cateIdMap = new Map<number, number>()
        for (const { id, name } of categories) {
            const added = await cateDatabase.add(name)
            cateIdMap.set(id, added.id)
        }

        sites.forEach(s => s.cate !== undefined && (s.cate = cateIdMap.get(s.cate)))
        await saveSite(...sites)
    }
}

const siteMigrator = new SiteMigrator()

export default siteMigrator