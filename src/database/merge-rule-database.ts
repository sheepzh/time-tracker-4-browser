/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isRecord } from '@util/guard'
import { createArrayGuard, createObjectGuard, createRecordGuard, createUnionGuard, isInt, isString } from 'typescript-guard'
import BaseDatabase from "./common/base-database"
import { REMAIN_WORD_PREFIX } from "./common/constant"
import { extractNamespace, isLegacyVersion } from './common/migratable'
import type { BrowserMigratable } from './types'

const DB_KEY = REMAIN_WORD_PREFIX + 'MERGE_RULES'

type MergeRuleSet = { [key: string]: string | number }

const isMergeValue = createUnionGuard(isString, isInt)

const isMergeRuleSet = createRecordGuard(isMergeValue)

const isMergeRule = createObjectGuard<timer.merge.Rule>({
    origin: isString,
    merged: isMergeValue,
})

/**
 * Rules to merge host
 *
 * @since 0.1.2
 */
class MergeRuleDatabase extends BaseDatabase implements BrowserMigratable<'__merge__'> {
    namespace: '__merge__' = '__merge__'

    async refresh(): Promise<MergeRuleSet> {
        const result = await this.storage.getOne<MergeRuleSet>(DB_KEY)
        return result || {}
    }

    private update(data: MergeRuleSet): Promise<void> {
        return this.setByKey(DB_KEY, data)
    }

    async selectAll(): Promise<timer.merge.Rule[]> {
        const set = await this.refresh()
        return Object.entries(set)
            .map(([origin, merged]) => ({ origin, merged } satisfies timer.merge.Rule))
    }

    async remove(origin: string): Promise<void> {
        const set = await this.refresh()
        delete set[origin]
        await this.update(set)
    }

    /**
     * Add to the db
     */
    async add(...toAdd: timer.merge.Rule[]): Promise<void> {
        const set = await this.refresh()
        // Not rewrite
        toAdd.forEach(({ origin, merged }) => set[origin] = set[origin] ?? merged)
        await this.update(set)
    }

    async importData(data: unknown): Promise<void> {
        if (isLegacyVersion(data)) {
            return this.importLegacyData(data)
        }
        const rules = extractNamespace(data, this.namespace, createArrayGuard(isMergeRule)) ?? []
        await this.add(...rules)
    }

    /**
     * @deprecated Only for legacy version
     */
    private async importLegacyData(data: unknown): Promise<void> {
        if (!isRecord(data)) return
        const toMigrate = data[DB_KEY]
        if (!isMergeRuleSet(toMigrate)) return
        const exist = await this.refresh()
        Object.entries(toMigrate satisfies MergeRuleSet)
            // Not rewrite
            .filter(([key]) => !exist[key])
            .forEach(([key, value]) => exist[key] = value)
        await this.update(exist)
    }

    exportData(): Promise<timer.merge.Rule[]> {
        return this.selectAll()
    }
}

const mergeRuleDatabase = new MergeRuleDatabase()

export default mergeRuleDatabase