import db from "@db/limit-database"
import { formatTimeYMD } from "@util/time"
import { mockStorage } from "../__mock__/storage"
import { mockLegacyData } from './migratable'

describe('limit-database', () => {
    beforeAll(() => mockStorage())

    beforeEach(async () => chrome.storage.local.clear())
    test('test1', async () => {
        const toAdd: timer.limit.Rule = {
            id: 1,
            name: "foobar",
            cond: ['123'],
            time: 20,
            enabled: true,
            allowDelay: false,
            locked: false,
        }
        const id = await db.save(toAdd)
        let all: timer.limit.Rule[] = await db.all()
        expect(all.length).toEqual(1)
        let saved = all[0]
        expect(saved.cond).toEqual(toAdd.cond)
        expect(saved.time).toEqual(toAdd.time)
        expect(saved.name).toEqual(toAdd.name)
        expect(saved.enabled).toEqual(toAdd.enabled)
        expect(saved.allowDelay).toEqual(toAdd.allowDelay)
        const toRewrite = {
            id,
            name: 'hahah',
            cond: ['123'],
            time: 21,
            enabled: true,
            allowDelay: false,
            locked: false,
        }
        // Not rewrite
        await db.save(toRewrite)
        all = await db.all()
        saved = all[0]
        expect(saved.cond).toEqual(toAdd.cond)
        expect(saved.time).toEqual(toAdd.time)
        expect(saved.name).toEqual(toAdd.name)
        expect(saved.enabled).toEqual(toAdd.enabled)
        expect(saved.allowDelay).toEqual(toAdd.allowDelay)

        await db.remove(id)

        expect((await db.all()).length).toEqual(0)
    })

    test("update waste", async () => {
        const date = formatTimeYMD(new Date())
        const id1 = await db.save({
            name: "foobar",
            cond: ["a.*.com"],
            time: 21,
            enabled: true,
            allowDelay: false,
            locked: false,
        })
        await db.save({
            name: "foobar",
            cond: ["*.b.com"],
            time: 20,
            enabled: true,
            allowDelay: false,
            locked: false,
        })
        await db.updateWaste(date, {
            [id1]: 10,
            // Not exist, no error throws
            [-1]: 20,
        })
        const all = await db.all()
        const used = all.find(a => a.cond?.includes("a.*.com"))
        expect(used?.records?.[date]).toBeTruthy()
        expect(used?.records?.[date].mill).toEqual(10)
    })

    test("import data", async () => {
        const cond1: MakeOptional<timer.limit.Rule, 'id'> = {
            name: 'foobar1',
            cond: ["cond1"],
            time: 20,
            allowDelay: false,
            enabled: true,
            locked: false,
        }
        const cond2: MakeOptional<timer.limit.Rule, 'id'> = {
            name: 'foobar2',
            cond: ["cond2"],
            time: 20,
            allowDelay: false,
            enabled: false,
            locked: false,
        }
        await db.save(cond1)
        await db.save(cond2)
        const data2Import = await db.storage.get()

        // clear
        chrome.storage.local.clear()
        expect(await db.all()).toEqual([])

        await db.importData(mockLegacyData(data2Import))
        const imported = await db.all()

        const cond2After = imported.find(a => a.cond?.includes("cond2"))
        expect(Object.values(cond2After?.records || {})).toBeTruthy()
        expect(cond2After?.allowDelay).toEqual(cond2.allowDelay)
        expect(cond2After?.enabled).toEqual(cond2.enabled)
    })

    test("import data2", async () => {
        const importData: Record<string, any> = {}
        // Invalid data, no error throws
        await db.importData(mockLegacyData(importData))
        // Valid data
        importData["__timer__LIMIT"] = {}
        await db.importData(mockLegacyData(importData))
        expect(await db.all()).toEqual([])
    })

    test("update delay", async () => {
        const data: MakeOptional<timer.limit.Rule, 'id'> = {
            name: 'foobar',
            cond: ["cond1"],
            time: 20,
            allowDelay: false,
            enabled: true,
            locked: false,
        }
        const id = await db.save(data)
        await db.updateDelay(id, true)
        await db.updateDelay(Number.MAX_VALUE, true)
        const all = await db.all()
        expect(all.length).toEqual(1)
        const item = all[0]
        expect(item.allowDelay).toBeTruthy()
        expect(item.cond).toEqual(["cond1"])
    })
})