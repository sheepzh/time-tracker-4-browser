/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import BaseDatabase from "./common/base-database"
import { REMAIN_WORD_PREFIX } from "./common/constant"

const KEY = REMAIN_WORD_PREFIX + 'CATE'

type Item = {
    /**
     * Name
     */
    n: string
    /**
     * Auto rules
     */
    a?: string[]
}

type Items = Record<number, Item>

function migrate(exist: Items, toMigrate: any) {
    let idBase = Object.keys(exist).map(parseInt).sort().reverse()?.[0] ?? 0 + 1
    const existLabels = new Set(Object.values(exist).map(e => e.n))

    Object.values(toMigrate).forEach(value => {
        const { n } = (value as Item) || {}
        if (!n || existLabels.has(n)) return

        const id = idBase
        idBase++
        exist[id] = { n }
    })
}

/**
 * Site tag
 *
 * @since 3.0.0
 */
class SiteCateDatabase extends BaseDatabase {
    private async getItems(): Promise<Items> {
        return await this.storage.getOne<Items>(KEY) || {}
    }

    private async saveItems(items: Items): Promise<void> {
        await this.storage.put(KEY, items || {})
    }

    async listAll(): Promise<timer.site.Cate[]> {
        const items = await this.getItems()
        return Object.entries(items).map(([id, { n = '', a } = {}]) => {
            return {
                id: parseInt(id),
                name: n,
                autoRules: a ?? [],
            } satisfies timer.site.Cate
        })
    }

    async add(name: string, autoRules: string[]): Promise<timer.site.Cate> {
        const items = await this.getItems()
        const existId = Object.entries(items).find(([_, v]) => v.n === name)?.[0]
        if (existId) {
            // Exist already
            return { id: parseInt(existId), name, autoRules }
        }

        const id = (Object.keys(items || {}).map(k => parseInt(k)).sort().reverse()?.[0] ?? 0) + 1
        items[id] = { n: name || items[id]?.n, a: autoRules }

        await this.saveItems(items)
        return { name, id, autoRules }
    }

    async update(id: number, name: string): Promise<void> {
        if (!name) return

        const items = await this.getItems()
        const existId = Object.entries(items).find(([_, v]) => v.n === name)?.[0]

        if (existId) {
            return
        }

        items[id] = { ...items[id] || {}, n: name }
        await this.saveItems(items)
    }

    async importData(data: any): Promise<void> {
        let toImport = data[KEY] as Items
        // Not import
        if (typeof toImport !== 'object') return
        const exists: Items = await this.getItems()
        migrate(exists, toImport)
        this.setByKey(KEY, exists)
    }

    async delete(id: number): Promise<void> {
        const items = await this.getItems()

        if (!items[id]) return
        delete items[id]
        await this.saveItems(items)
    }
}

const siteCateDatabase = new SiteCateDatabase()

export default siteCateDatabase