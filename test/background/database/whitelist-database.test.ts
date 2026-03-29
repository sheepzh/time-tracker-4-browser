import db from "@db/whitelist-database"
import { mockStorage } from "../../__mock__/storage"

describe('timer-database', () => {
    beforeAll(mockStorage)

    beforeEach(async () => chrome.storage.local.clear())

    test('add, selectAll, exist, remove work correctly', async () => {
        await db.add('www.baidu.com')
        await db.add('google.com')
        const list = await db.selectAll()
        expect(list.sort()).toEqual(['www.baidu.com', 'google.com'].sort())
        expect((await db.exist('www.baidu.com'))).toBeTruthy()
        await db.remove('www.baidu.com')
        await db.remove('www.baidu.com111')
        expect((await db.selectAll())).toEqual(['google.com'])
        expect((await db.exist('www.baidu.com'))).toBeFalsy()
        await db.add('google.com')
        expect((await db.selectAll())).toEqual(['google.com'])
    })
})