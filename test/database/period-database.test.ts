import db from "@db/period-database"
import { keyOf } from "@util/period"
import { formatTimeYMD } from "@util/time"
import { mockStorage } from "../__mock__/storage"

function resultOf(date: Date, orderNum: number, milliseconds: number): timer.period.Result {
    return { ...keyOf(date, orderNum), milliseconds }
}

describe('period-database', () => {
    beforeAll(mockStorage)

    beforeEach(async () => chrome.storage.local.clear())

    test('1', async () => {
        const date = new Date(2021, 5, 7)
        const dateStr = formatTimeYMD(date)
        const yesterday = new Date(2021, 5, 6)

        expect((await db.get(dateStr))).toEqual({})

        const toAdd: timer.period.Result[] = [
            resultOf(date, 0, 56999),
            resultOf(date, 1, 2),
            resultOf(yesterday, 95, 2)
        ]
        await db.accumulate(toAdd)
        await db.accumulate([
            resultOf(date, 1, 20)
        ])
        const data = await db.get(dateStr)
        expect(data).toEqual({ 0: 56999, 1: 22 })
        const yesterdayStr = formatTimeYMD(yesterday)
        const yesterdayData = await db.get(yesterdayStr)
        expect(yesterdayData).toEqual({ 95: 2 })
    })

    test('getBatch', async () => {
        const date = new Date(2021, 5, 7)
        const yesterday = new Date(2021, 5, 6)
        const toAdd: timer.period.Result[] = [
            resultOf(date, 0, 56999),
            resultOf(date, 1, 2),
            resultOf(yesterday, 95, 2)
        ]
        await db.accumulate(toAdd)

        let list = await db.getBatch(['20210607', '20210606'])
        expect(list.length).toEqual(3)
        let all = await db.getAll()
        expect(all).toEqual(toAdd)
    })
})
