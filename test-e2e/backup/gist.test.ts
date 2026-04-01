import { launchBrowser, MOCK_URL, sleep, type LaunchContext } from '../common/base'
import { readRecordsOfFirstPage } from '../common/record'
import { BackupOptionWrapper } from './common'

const GIST_MOCK_ORIGIN = 'http://127.0.0.1:12347'
const GIST_MOCK_TOKEN = 'github_gist_mock_token'

const _keepAlive = setInterval(() => {}, 2147483647)

let context: LaunchContext

describe('Backup with gist', () => {
    beforeEach(async () => {
        context = await launchBrowser({ proxies: [{ host: 'api.github.com', target: GIST_MOCK_ORIGIN }] })
    })

    afterEach(() => context.close())

    test('create and update gist', async () => {
        // Fill in gist parameters
        const option = new BackupOptionWrapper(context)
        const page = await option.changeType('gist')

        const tokenInput = await option.$('input[name="token"]')
        expect(tokenInput).toBeTruthy()

        // Assert test invalid with invalid token
        await tokenInput!.type('foobar' + Date.now())
        await option.assertTestInvalid()

        // Assert token is valid
        await tokenInput!.focus()
        await tokenInput!.evaluate(el => {
            if (!(el instanceof HTMLInputElement)) return
            el.value = ''
            el.dispatchEvent(new Event('input', { bubbles: true }))
        })
        await tokenInput!.type(GIST_MOCK_TOKEN)
        await option.assertTestValid()

        // Visit site
        const sitePage = await context.newPageAndWaitCsInjected(MOCK_URL)
        await sleep(2)
        await sitePage.close()
        let originalRecords = await readRecordsOfFirstPage(context)
        expect(originalRecords.length).toEqual(1)
        const original = originalRecords[0]

        // Upload the data to gist
        await option.assertBackupSuccess()

        // Check download content
        await sleep(1)
        await option.downloadCurrentWithAcc()

        const twiceRecords = await readRecordsOfFirstPage(context)
        expect(twiceRecords.length).toEqual(1)
        const after = twiceRecords[0]
        expect(after.url).toEqual(original.url)
        expect(after.visit).toEqual('2')

        // Clear data
        await option.clearData()

        // Assert can't download current
        await sleep(1)
        await option.assertCantDownloadCurr()
    })
})
