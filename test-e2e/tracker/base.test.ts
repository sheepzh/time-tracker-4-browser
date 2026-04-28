import { launchBrowser, type LaunchContext } from '../common/base'
import { readRecordsOfFirstPage } from "../common/record"
import { MOCK_HOST, MOCK_URL, MOCK_URL_2, sleep } from '../common/util'
import { createWhitelist } from "../common/whitelist"

let context: LaunchContext

describe('Tracking', () => {
    beforeEach(async () => { context = await launchBrowser() })

    afterEach(() => context.close())

    test('basic tracking', async () => {
        const page = await context.newPageAndWaitCsInjected(MOCK_URL)
        await sleep(2)
        let records = await readRecordsOfFirstPage(context)

        expect(records.length).toEqual(1)
        const { visit: visitStr, time: timeStr } = records[0] ?? {}
        // 1 visit
        expect(visitStr).toEqual("1")
        // >= 2 s
        const time = timeStr ? parseInt(timeStr.replace('s', '').trim()) : NaN
        expect(time >= 2)

        // Another page
        await page.bringToFront()
        await page.goto(MOCK_URL_2)

        records = await readRecordsOfFirstPage(context)
        expect(records.length).toEqual(2)
        const urls = records.map(r => r.url)
        expect(urls.includes(MOCK_HOST))
    }, 60000)

    test('white list', async () => {
        const page = await context.newPageAndWaitCsInjected(MOCK_URL)
        await sleep(2)
        let records = await readRecordsOfFirstPage(context)

        expect(records.length).toEqual(1)
        const { visit: visitStr, time: timeStr } = records[0] ?? {}
        // 1 visit
        expect(visitStr).toEqual("1")
        // >= 2 s
        const time = timeStr ? parseInt(timeStr.replace('s', '').trim()) : NaN
        expect(time >= 2)

        await createWhitelist(context, MOCK_HOST)
        await page.bringToFront()
        await page.reload()
        await sleep(2)
        records = await readRecordsOfFirstPage(context)
        expect(records.length).toEqual(1)
        expect(records[0]?.time).toEqual(timeStr)
        expect(records[0]?.visit).toEqual("1")
    }, 60000)
})