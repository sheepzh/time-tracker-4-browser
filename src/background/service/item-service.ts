import { isValidGroup } from "@api/chrome/tabGroups"
import db from "@db/stat-database"
import { resultOf } from "@util/stat"
import optionHolder from "./components/option-holder"
import siteHolder from './site-service/holder'

export type ItemIncContext = {
    host: string
    url: string
    groupId?: number
}

export async function addFocusTime(context: ItemIncContext, focusTime: number): Promise<void> {
    const { host, url, groupId } = context

    const resultSet: Record<string, tt4b.core.Result> = { [host]: resultOf(focusTime, 0) }
    const virtualSites = siteHolder.matchVirtual(url)
    virtualSites.forEach(({ host }) => resultSet[host] = resultOf(focusTime, 0))

    const now = new Date()

    await db.batchAccumulate(resultSet, now)

    const { countTabGroup } = await optionHolder.get()
    countTabGroup && isValidGroup(groupId) && db.accumulateGroup(groupId, now, resultOf(focusTime, 0))
}

export async function addRunTime(host: string, dateTime: Record<string, number>) {
    for (const [date, run] of Object.entries(dateTime)) {
        await db.accumulate(host, date, { focus: 0, time: 0, run })
    }
}

export async function addMediaTime(host: string, dateTime: Record<string, number>) {
    for (const [date, media] of Object.entries(dateTime)) {
        await db.accumulate(host, date, { focus: 0, time: 0, media })
    }
}

export async function increaseVisit(context: ItemIncContext) {
    const { host, url, groupId } = context
    const resultSet = { [host]: resultOf(0, 1) }
    siteHolder.matchVirtual(url).forEach(({ host }) => resultSet[host] = resultOf(0, 1))

    const now = new Date()

    await db.batchAccumulate(resultSet, now)

    const { countTabGroup } = await optionHolder.get()
    countTabGroup && isValidGroup(groupId) && await db.accumulateGroup(groupId, now, resultOf(0, 1))
}

export async function getTodayResult(host: string) {
    const option = await optionHolder.get()
    if (!option.printInConsole) return undefined
    return await db.get(host, new Date())
}