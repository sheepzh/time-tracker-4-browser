import { useLaunchContext } from '../common/base'
import { assertOverlayHidden, waitForLimitFrame } from '../common/overlay'
import { MOCK_URL, sleep } from '../common/util'
import { createLimitRule } from './common'

describe('Time limit per visit', () => {
    const context = useLaunchContext()

    test("Delay", async () => {
        const limitPage = await context.openAppPage('/productivity/limit')
        const demoRule: tt4b.limit.Rule = {
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
        await assertOverlayHidden(testPage, 500)
    }, 60_000)
})