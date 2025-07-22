import { launchBrowser, LaunchContext, MOCK_URL, sleep } from '../common/base'
import { createLimitRule } from './common'

describe('Time limit per visit', () => {
    let context: LaunchContext

    beforeEach(async () => context = await launchBrowser())

    afterEach(() => context.close())

    test("More 5 minutes", async () => {
        const limitPage = await context.openAppPage('/behavior/limit')
        const demoRule: timer.limit.Rule = {
            id: 1, name: 'TEST DAILY LIMIT',
            cond: [MOCK_URL],
            visitTime: 1,
            enabled: true, allowDelay: true, locked: false,
        }

        // 1. Insert limit rule
        await createLimitRule(demoRule, limitPage)

        // 2. Open test page
        const testPage = await context.newPageAndWaitCsInjected(MOCK_URL)
        await sleep(2)

        // 3. Modal exist and then click more 5 minutes
        const clicked = await testPage.evaluate(() => {
            const shadow = document.querySelector('extension-time-tracker-overlay')
            if (!shadow) return false
            const button = shadow.shadowRoot?.querySelector<HTMLButtonElement>('.el-button--primary')
            button?.click()
            return !!button
        })
        expect(clicked).toBeTruthy()

        // 4. Modal disappear
        await sleep(.5)
        const modalExist = await testPage.evaluate(() => {
            const shadow = document.querySelector('extension-time-tracker-overlay')
            if (!shadow) return false
            return !!shadow.shadowRoot!.querySelector('body:not([style*="display: none"])')
        })
        expect(modalExist).toBeFalsy()

    }, 10000)
})