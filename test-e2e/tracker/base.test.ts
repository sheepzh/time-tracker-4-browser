import { launchBrowser, type LaunchContext, MOCK_HOST, MOCK_URL, MOCK_URL_2, sleep } from "../common/base"
import { readRecordsOfFirstPage } from "../common/record"
import { createWhitelist } from "../common/whitelist.test"

let context: LaunchContext

describe('Tracking', () => {
    beforeEach(async () => context = await launchBrowser())

    afterEach(() => context.close())

    test('basic tracking', async () => {
        const page = await context.newPageAndWaitCsInjected(MOCK_URL)
        await sleep(2)
        let records = await readRecordsOfFirstPage(context)

        expect(records.length).toEqual(1)
        const { visit: visitStr, time: timeStr } = records[0]
        // 1 visit
        expect(visitStr).toEqual("1")
        // >= 2 s
        const time = parseInt(timeStr.replace('s', '').trim())
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
        const { visit: visitStr, time: timeStr } = records[0]
        // 1 visit
        expect(visitStr).toEqual("1")
        // >= 2 s
        const time = parseInt(timeStr.replace('s', '').trim())
        expect(time >= 2)

        await createWhitelist(context, MOCK_HOST)
        await page.bringToFront()
        await page.reload()
        await sleep(2)
        records = await readRecordsOfFirstPage(context)
        expect(records.length).toEqual(1)
        expect(records[0].time).toEqual(timeStr)
        expect(records[0].visit).toEqual("1")
    }, 60000)
})