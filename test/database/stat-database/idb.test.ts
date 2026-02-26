import { zeroResult, zeroRow } from '@db/stat-database/common'
import { IDBStatDatabase } from '@db/stat-database/idb'
import 'fake-indexeddb/auto'
import { mockRuntime } from '../../__mock__/runtime'

const GOOGLE = 'www.google.com'
const GITHUB = 'www.github.com'
const GITHUB_VIRTUAL = 'www.github.com/sheepzh/**'
const GROUP_1 = 1
const GROUP_2 = 2
const MAYBE_GROUP_1 = '1'

let db: IDBStatDatabase

describe('stat-database/idb', () => {
    beforeAll(async () => {
        mockRuntime()
        db = new IDBStatDatabase()
        await db.upgrade()
    })

    beforeEach(() => db.clear())

    test('accumulate', async () => {
        await db.accumulate(GITHUB, '20240601', { focus: 10, time: 20 })
        await db.accumulate(GOOGLE, new Date(2025, 10, 1), { focus: 1, time: 0 })
        await db.accumulateGroup(GROUP_1, '20240601', { focus: 5, time: 10 })

        // Hosts
        const github = await db.get(GITHUB, '20240601')
        expect(github).toEqual({ host: GITHUB, date: '20240601', focus: 10, time: 20 } satisfies timer.core.Row)

        const google = await db.get(GOOGLE, new Date(2025, 10, 1))
        expect(google).toEqual({ host: GOOGLE, date: '20251101', focus: 1, time: 0 } satisfies timer.core.Row)

        // Date not exist
        const notExist = await db.get(GOOGLE, '20240601')
        expect(notExist).toEqual(zeroRow(GOOGLE, '20240601'))

        // list
        const list = await db.select()
        expect(list).toEqual([
            { host: GITHUB, date: '20240601', focus: 10, time: 20 },
            { host: GOOGLE, date: '20251101', focus: 1, time: 0 },
        ] satisfies timer.core.Row[])

        // Groups
        const byGroupId = await db.get(`${GROUP_1}`, '20240601')
        expect(byGroupId).toMatchObject(zeroResult())

        const groups = await db.selectGroup({ date: new Date(2024, 5, 1) })
        expect(groups).toEqual([{ host: `${GROUP_1}`, date: '20240601', focus: 5, time: 10 } satisfies timer.core.Row])
    })

    test('batchAccumulate', async () => {
        // Noise data
        await db.accumulateGroup(GROUP_1, '20240602', { focus: 5, time: 10 })

        await db.batchAccumulate({
            [GOOGLE]: { focus: 1, time: 0 },
            [GITHUB]: { focus: 10, time: 20 },
            [MAYBE_GROUP_1]: { focus: 5, time: 10 },
        }, '20240602')

        expect(await db.get(GITHUB, '20240602'))
            .toEqual({ host: GITHUB, date: '20240602', focus: 10, time: 20 } satisfies timer.core.Row)
        expect(await db.get(GOOGLE, '20240602'))
            .toEqual({ host: GOOGLE, date: '20240602', focus: 1, time: 0 } satisfies timer.core.Row)
        expect(await db.get(MAYBE_GROUP_1, '20240602'))
            .toEqual({ host: MAYBE_GROUP_1, date: '20240602', focus: 5, time: 10 } satisfies timer.core.Row)

        await db.batchAccumulate({ [GOOGLE]: { focus: 0, time: 1 } }, '20240602')

        expect(await db.get(GOOGLE, '20240602')).toEqual({ host: GOOGLE, date: '20240602', focus: 1, time: 1 } satisfies timer.core.Row)
    })

    test('multiple indexes', async () => {
        // Insert noise data
        await db.accumulateGroup(GROUP_1, '20240603', { focus: 30, time: 20 })

        await db.batchAccumulate({
            [GOOGLE]: { focus: 1, time: 0 },
            [GITHUB]: { focus: 10, time: 20 },
            [GITHUB_VIRTUAL]: { focus: 5, time: 10 },
        }, '20240603')

        await db.batchAccumulate({
            [GOOGLE]: { focus: 1, time: 0 },
            [GITHUB]: { focus: 10, time: 20 },
        }, '20240602')

        await db.accumulateGroup(GROUP_1, '20240603', { focus: 5, time: 10 })
        await db.accumulateGroup(GROUP_1, '20240602', { focus: 1, time: 1 })

        // Query by date index
        expect(await db.select({ date: [, new Date(2024, 5, 2)] })).toEqual([
            { host: GITHUB, date: '20240602', focus: 10, time: 20 },
            { host: GOOGLE, date: '20240602', focus: 1, time: 0 },
        ] satisfies timer.core.Row[])
        expect(await db.select({ date: new Date(2024, 5, 3) })).toEqual([
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
            { host: GOOGLE, date: '20240603', focus: 1, time: 0 },
        ] satisfies timer.core.Row[])
        expect(await db.select({ date: [new Date(2024, 5, 2), new Date(2024, 5, 3)] })).toEqual([
            { host: GITHUB, date: '20240602', focus: 10, time: 20 },
            { host: GOOGLE, date: '20240602', focus: 1, time: 0 },
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
            { host: GOOGLE, date: '20240603', focus: 1, time: 0 },
        ] satisfies timer.core.Row[])
        // Same as above, but reversed order
        expect(await db.select({ date: [new Date(2024, 5, 3), new Date(2024, 5, 2)] })).toEqual([
            { host: GITHUB, date: '20240602', focus: 10, time: 20 },
            { host: GOOGLE, date: '20240602', focus: 1, time: 0 },
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
            { host: GOOGLE, date: '20240603', focus: 1, time: 0 },
        ] satisfies timer.core.Row[])
        // Including virtual
        expect(await db.select({ date: new Date(2024, 5, 3), virtual: true })).toEqual([
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
            { host: GITHUB_VIRTUAL, date: '20240603', focus: 5, time: 10 },
            { host: GOOGLE, date: '20240603', focus: 1, time: 0 },
        ] satisfies timer.core.Row[])

        // Query by host
        expect(await db.select({ keys: GOOGLE })).toEqual([
            { host: GOOGLE, date: '20240602', focus: 1, time: 0 },
            { host: GOOGLE, date: '20240603', focus: 1, time: 0 },
        ] satisfies timer.core.Row[])
        expect(await db.select({ keys: GITHUB })).toEqual([
            { host: GITHUB, date: '20240602', focus: 10, time: 20 },
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
        ] satisfies timer.core.Row[])
        expect(await db.select({ keys: GITHUB_VIRTUAL })).toEqual([] satisfies timer.core.Row[])
        expect(await db.select({ keys: GITHUB_VIRTUAL, virtual: true })).toEqual([
            { host: GITHUB_VIRTUAL, date: '20240603', focus: 5, time: 10 },
        ] satisfies timer.core.Row[])

        // Query by date and host index
        expect(await db.select({ date: new Date(2024, 5, 3), keys: GOOGLE })).toEqual([
            { host: GOOGLE, date: '20240603', focus: 1, time: 0 },
        ] satisfies timer.core.Row[])
        expect(await db.select({ date: new Date(2024, 5, 3), keys: GITHUB_VIRTUAL })).toEqual([] satisfies timer.core.Row[])
        expect(await db.select({ date: new Date(2024, 5, 3), keys: GITHUB_VIRTUAL, virtual: true })).toEqual([
            { host: GITHUB_VIRTUAL, date: '20240603', focus: 5, time: 10 },
        ] satisfies timer.core.Row[])

        // Query by time index
        expect(await db.select({ timeRange: [10, 20] })).toEqual([
            { host: GITHUB, date: '20240602', focus: 10, time: 20 },
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
        ] satisfies timer.core.Row[])
        expect(await db.select({ timeRange: [10, 20], virtual: true })).toEqual([
            { host: GITHUB_VIRTUAL, date: '20240603', focus: 5, time: 10 },
            { host: GITHUB, date: '20240602', focus: 10, time: 20 },
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
        ] satisfies timer.core.Row[])
        expect(await db.select({ timeRange: [10, 20], date: new Date(2024, 5, 3), virtual: true })).toEqual([
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
            { host: GITHUB_VIRTUAL, date: '20240603', focus: 5, time: 10 },
        ] satisfies timer.core.Row[])

        // Query by focus index
        expect(await db.select({ focusRange: [5, 10] })).toEqual([
            { host: GITHUB, date: '20240602', focus: 10, time: 20 },
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
        ] satisfies timer.core.Row[])
        expect(await db.select({ focusRange: [5, 10], virtual: true })).toEqual([
            { host: GITHUB_VIRTUAL, date: '20240603', focus: 5, time: 10 },
            { host: GITHUB, date: '20240602', focus: 10, time: 20 },
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
        ] satisfies timer.core.Row[])
        expect(await db.select({ focusRange: [5, 10], date: new Date(2024, 5, 3), virtual: true })).toEqual([
            { host: GITHUB, date: '20240603', focus: 10, time: 20 },
            { host: GITHUB_VIRTUAL, date: '20240603', focus: 5, time: 10 },
        ] satisfies timer.core.Row[])
    })

    test('delete', async () => {
        await db.batchAccumulate({
            [GOOGLE]: { focus: 1, time: 0 },
            [GITHUB]: { focus: 10, time: 20 },
            [GITHUB_VIRTUAL]: { focus: 5, time: 10 },
            [MAYBE_GROUP_1]: { focus: 222, time: 222 },
        }, '20240603')

        expect((await db.select({ virtual: true })).length).toEqual(4)

        await db.delete({ host: GOOGLE, date: '20240603' })
        expect(await db.get(GOOGLE, '20240603')).toEqual(zeroRow(GOOGLE, '20240603'))

        await db.deleteByHost(GITHUB)
        expect(await db.get(GITHUB, '20240603')).toEqual(zeroRow(GITHUB, '20240603'))

        await db.deleteByGroup(GROUP_1)
        expect(await db.get(MAYBE_GROUP_1, '20240603'))
            .toEqual({ host: MAYBE_GROUP_1, date: '20240603', focus: 222, time: 222 } satisfies timer.core.Row)

        await db.delete({ host: MAYBE_GROUP_1, date: '20240603' }, { host: GITHUB_VIRTUAL, date: '20240603' })
        expect(await db.select({ virtual: true })).toEqual([] satisfies timer.core.Row[])
    })

    test('multiple select groups', async () => {
        // Insert noise data
        await db.batchAccumulate({
            [GOOGLE]: { focus: 1, time: 0 },
            [GITHUB]: { focus: 10, time: 20 },
            [GITHUB_VIRTUAL]: { focus: 5, time: 10 },
            [MAYBE_GROUP_1]: { focus: 222, time: 222 },
        }, '20240603')

        await db.accumulateGroup(GROUP_1, '20240602', { focus: 1, time: 1 })
        await db.accumulateGroup(GROUP_2, '20240602', { focus: 2, time: 2 })
        await db.accumulateGroup(GROUP_1, '20240603', { focus: 3, time: 3 })
        await db.accumulateGroup(GROUP_2, '20240603', { focus: 4, time: 4 })

        expect(await db.selectGroup({ date: new Date(2024, 5, 3) })).toEqual([
            { date: '20240603', host: `${GROUP_1}`, focus: 3, time: 3 },
            { date: '20240603', host: `${GROUP_2}`, focus: 4, time: 4 },
        ] satisfies timer.core.Row[])

        expect(await db.selectGroup({ date: [new Date(2024, 5, 2), new Date(2024, 5, 3)], keys: GROUP_1.toString() })).toEqual([
            { date: '20240602', host: `${GROUP_1}`, focus: 1, time: 1 },
            { date: '20240603', host: `${GROUP_1}`, focus: 3, time: 3 },
        ] satisfies timer.core.Row[])
    })
})