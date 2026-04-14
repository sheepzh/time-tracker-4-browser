import { launchBrowser, type LaunchContext } from '../common/base'
import { MOCK_URL, sleep } from '../common/util'
import { createLimitRule, isLimitModalVisible, waitForLimitFrame } from './common'

describe('Time limit per visit', () => {
    let context: LaunchContext

    beforeEach(async () => { context = await launchBrowser() })

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
        const limitFrame = await waitForLimitFrame(testPage)
        const button = await limitFrame.waitForSelector('.el-button--primary')
        expect(button).toBeTruthy()
        await button!.click()

        // 4. Modal disappear
        await sleep(.5)
        const modalExist = await isLimitModalVisible(testPage)
        expect(modalExist).toBeFalsy()

    }, 10000)
})