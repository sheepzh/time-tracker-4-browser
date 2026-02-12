import db from "@db/merge-rule-database"
import { mockStorage } from "../__mock__/storage"
import { mockLegacyData } from './migratable'

function of(origin: string, merged?: string | number): timer.merge.Rule {
    return { origin, merged: merged || '' }
}

describe('merge-rule-database.test', () => {
    beforeAll(mockStorage)

    beforeEach(async () => chrome.storage.local.clear())

    test('1', async () => {
        let toAdd: timer.merge.Rule[] = [of('4', 2)]
        await db.add(...toAdd)
        expect((await db.selectAll())).toEqual(expect.arrayContaining(toAdd))
        toAdd = [
            of('4'),
            of('3')
        ]
        await db.add(...toAdd)
        expect((await db.selectAll())).toEqual(expect.arrayContaining([
            // Not rewrite
            of('4', 2),
            of('3')
        ]))
        await db.remove('4')
        const list = await db.selectAll()
        expect(list.length).toEqual(1)
        expect(list[0]).toEqual(of('3', ''))
    })

    test("importData", async () => {
        await db.add(
            of("www.baidu.com", 2),
            of("www.google.com", "google.com")
        )
        const data2Import = await db.storage.get()
        data2Import.foo = "bar"
        await chrome.storage.local.clear()
        expect(await db.selectAll()).toEqual([])

        await db.importData(mockLegacyData(data2Import))
        const imported: timer.merge.Rule[] = await db.selectAll()
        expect(imported).toEqual([
            { origin: "www.baidu.com", merged: 2 },
            { origin: "www.google.com", merged: "google.com" }
        ])
    })

    test("importData2", async () => {
        await db.importData(undefined)
        expect(await db.selectAll()).toEqual([])
        await db.importData({ foo: "bar" })
        expect(await db.selectAll()).toEqual([])
    })
})