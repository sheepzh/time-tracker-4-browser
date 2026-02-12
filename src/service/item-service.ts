import { isValidGroup } from "@api/chrome/tabGroups"
import db, { type StatCondition } from "@db/stat-database"
import { resultOf } from "@util/stat"
import optionHolder from "./components/option-holder"
import virtualSiteHolder from "./components/virtual-site-holder"

export type ItemIncContext = {
    host: string
    url: string
    groupId?: number
}

async function addFocusTime(context: ItemIncContext, focusTime: number): Promise<void> {
    const { host, url, groupId } = context

    const resultSet: Record<string, timer.core.Result> = { [host]: resultOf(focusTime, 0) }
    const virtualHosts = virtualSiteHolder.findMatched(url)
    virtualHosts.forEach(virtualHost => resultSet[virtualHost] = resultOf(focusTime, 0))

    const now = new Date()

    await db.batchAccumulate(resultSet, now)

    const { countTabGroup } = await optionHolder.get()
    countTabGroup && isValidGroup(groupId) && db.accumulateGroup(groupId, now, resultOf(focusTime, 0))
}

async function addRunTime(host: string, dateTime: Record<string, number>) {
    for (const [date, run] of Object.entries(dateTime)) {
        await db.accumulate(host, date, { focus: 0, time: 0, run })
    }
}

async function increaseVisit(context: ItemIncContext) {
    const { host, url, groupId } = context
    const resultSet = { [host]: resultOf(0, 1) }
    virtualSiteHolder.findMatched(url).forEach(virtualHost => resultSet[virtualHost] = resultOf(0, 1))

    const now = new Date()

    await db.batchAccumulate(resultSet, now)

    const { countTabGroup } = await optionHolder.get()
    countTabGroup && isValidGroup(groupId) && await db.accumulateGroup(groupId, now, resultOf(0, 1))
}

const getResult = (host: string, date: Date | string) => db.get(host, date)

const selectItems = (cond: StatCondition) => db.select(cond)

async function deleteByGroup(groupId: number): Promise<void> {
    await db.deleteByGroup(groupId)
}

export default {
    addFocusTime,
    addRunTime,
    increaseVisit,
    getResult,
    selectItems,
    deleteByGroup,
}