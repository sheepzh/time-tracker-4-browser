import { removeLimitItem, selectLimitItems, updateLimitItem } from "@service/limit-service"
import { cleanCond } from "@util/limit"
import type { Migrator } from "./common"

export default class LimitRuleMigrator implements Migrator {
    onInstall(): void {
    }

    async onUpdate(_version: string): Promise<void> {
        const rules = await selectLimitItems()
        if (!rules?.length) return
        const needUpdate: timer.limit.Rule[] = []
        const needRemoved: timer.limit.Rule[] = []
        rules.forEach(async rule => {
            const { cond } = rule
            let changed = false
            const newCond: string[] = []
            cond?.forEach(url => {
                const clean = cleanCond(url)
                changed = changed || clean !== url
                clean && newCond.push(clean)
            })
            if (!changed) return
            if (rule.cond.length) {
                rule.cond = newCond
                needUpdate.push(rule)
            } else {
                needRemoved.push(rule)
            }

        })
        needRemoved.length && await removeLimitItem(...needRemoved)
        needUpdate.length && await updateLimitItem(...needUpdate)
    }
}