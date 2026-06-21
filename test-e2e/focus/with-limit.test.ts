import { useLaunchContext } from '../common/base'
import { waitForLimitFrame } from '../common/overlay'
import { MOCK_URL, sleep } from '../common/util'
import { createLimitRule } from '../limit/common'
import { clickAction, getFocusBlockInfo, startSession } from './common'

describe("Integration with Limit Block", () => {
    const context = useLaunchContext()

    test('should work with limit block', async () => {
        // Create limit rule
        const limitPage = await context.openAppPage('/productivity/limit')
        await createLimitRule({
            name: 'Test Limit Rule',
            cond: [MOCK_URL],
            visitTime: 1,
            allowDelay: false,
        }, limitPage)

        // Open blocked page
        const popupPage = await context.openPopupPage('focus')
        await startSession(popupPage, { method: 'focus', policy: 'block', cond: [MOCK_URL] })

        // Check if focus block is shown in the limit frame
        const testPage = await context.newPageAndWaitCsInjected(MOCK_URL)
        const frame = await waitForLimitFrame(testPage)
        const info = await getFocusBlockInfo(frame)
        expect(info.title).toContain("Focus")

        // Wait for limit rule taking effective and abort focus
        await sleep(1.5)
        await popupPage.bringToFront()
        await clickAction(popupPage, 'abort')

        // limit block should disappear and not to display focus info
        await testPage.bringToFront()
        const limitFrame = await waitForLimitFrame(testPage)
        const limitFrameInfo = await getFocusBlockInfo(limitFrame)
        expect(limitFrameInfo.title).not.toContain("Focus")
    })
})