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
}

type Items = Record<number, Item>

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
        return Object.entries(items).map(([id, { n = '' } = {}]) => {
            return {
                id: parseInt(id),
                name: n,
            } satisfies timer.site.Cate
        })
    }

    async add(name: string): Promise<timer.site.Cate> {
        const items = await this.getItems()
        const existId = Object.entries(items).find(([_, v]) => v.n === name)?.[0]
        if (existId) {
            // Exist already
            return { id: parseInt(existId), name }
        }

        const id = (Object.keys(items || {}).map(k => parseInt(k)).sort().reverse()?.[0] ?? 0) + 1
        items[id] = { n: name || items[id]?.n }

        await this.saveItems(items)
        return { name, id }
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

    async delete(id: number): Promise<void> {
        const items = await this.getItems()

        if (!items[id]) return
        delete items[id]
        await this.saveItems(items)
    }
}

const siteCateDatabase = new SiteCateDatabase()

export default siteCateDatabase