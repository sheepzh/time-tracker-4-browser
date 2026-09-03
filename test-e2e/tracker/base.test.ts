import { useLaunchContext } from '../common/base'
import { readRecordsOfFirstPage } from "../common/record"
import { setSiteOption } from '../common/site'
import { MOCK_HOST, MOCK_URL, MOCK_URL_2, sleep } from '../common/util'

describe('Tracking', () => {
    const context = useLaunchContext()

    test('basic tracking', async () => {
        const page = await context.newPageAndWaitCsInjected(MOCK_URL)
        await sleep(2)
        let records = await readRecordsOfFirstPage(context)

        expect(records.length).toEqual(1)
        const { visit: visitStr, time: timeStr } = records[0] ?? {}
        // 1 visit
        expect(visitStr).toEqual("1")
        // >= 2 s
        const time = timeStr ? Number.parseInt(timeStr.replace('s', '').trim()) : NaN
        expect(time).toBeGreaterThanOrEqual(2)

        // Another page
        await page.bringToFront()
        await page.goto(MOCK_URL_2)

        records = await readRecordsOfFirstPage(context)
        expect(records.length).toEqual(2)
        const urls = records.map(r => r.url)
        expect(urls).include(MOCK_HOST)
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
        const time = timeStr ? Number.parseInt(timeStr.replace('s', '').trim()) : NaN
        expect(time).toBeGreaterThanOrEqual(2)

        await setSiteOption(context, MOCK_HOST, 'white', true)
        await page.bringToFront()
        await page.reload()
        await sleep(2)
        records = await readRecordsOfFirstPage(context)
        expect(records.length).toEqual(1)
        expect(records[0]?.time).toEqual(timeStr)
        expect(records[0]?.visit).toEqual("1")
    }, 60000)
})