import { useLaunchContext } from '../common/base'
import { assertOverlayHidden, assertOverlayVisible, waitForLimitFrame } from '../common/overlay'
import { MOCK_HOST, MOCK_URL, MOCK_URL_2 } from '../common/util'
import { clickAction, getFocusBlockInfo, startSession, startSessionViaApi } from './common'

describe('Focus Block', () => {
    const context = useLaunchContext()

    test('allow mode', async () => {
        const popupPage = await context.openPopupPage('focus')
        await startSession(popupPage, { method: 'focus', policy: 'allow', cond: [MOCK_URL] })

        // 1. Non-allowed page should be blocked
        const blocked = await context.newPage(MOCK_URL_2)
        await waitForLimitFrame(blocked)
        await assertOverlayVisible(blocked)

        // 2. Allowed site is not blocked
        const allowed = await context.newPage(MOCK_URL)
        await assertOverlayHidden(allowed)

        // 3. Pause to remove block
        await popupPage.bringToFront()
        await clickAction(popupPage, 'pause')
        await blocked.bringToFront()
        await assertOverlayHidden(blocked)

        // 4. Resume to block again
        await popupPage.bringToFront()
        await clickAction(popupPage, 'resume')
        await blocked.bringToFront()
        await waitForLimitFrame(blocked)
        await assertOverlayVisible(blocked)

        // 5. Stop to end session and unblock
        await popupPage.bringToFront()
        await clickAction(popupPage, 'stop')
        await blocked.bringToFront()
        await assertOverlayHidden(blocked)
    })

    test('block mode', async () => {
        const popupPage = await context.openPopupPage('focus')
        await startSession(popupPage, { method: 'focus', policy: 'block', cond: [MOCK_URL] })

        // 1. Blocked page should be blocked
        const blocked = await context.newPage(MOCK_URL)
        const frame = await waitForLimitFrame(blocked)
        const info = await getFocusBlockInfo(frame)
        expect(info.prompt).toContain('Focus')
        expect(info.stoppable).toBeTruthy()

        // 2. Non-blocked site is not blocked
        const allowed = await context.newPage(MOCK_URL_2)
        await assertOverlayHidden(allowed)

        // 3. Pause to remove block
        await popupPage.bringToFront()
        await clickAction(popupPage, 'pause')
        await blocked.bringToFront()
        await assertOverlayHidden(blocked)

        // 4. Resume to block again
        await popupPage.bringToFront()
        await clickAction(popupPage, 'resume')
        await blocked.bringToFront()
        await waitForLimitFrame(blocked)
        await assertOverlayVisible(blocked)

        // 5. Stop to end session and unblock
        // todo : stop on frame page
        await popupPage.bringToFront()
        await clickAction(popupPage, 'stop')
        await blocked.bringToFront()
        await assertOverlayHidden(blocked)
    })

    test('naturally finish', async () => {
        const popupPage = await context.openPopupPage('focus')
        await startSessionViaApi(popupPage, {
            method: 'focus',
            policy: 'block',
            cond: [MOCK_HOST],
            duration: 2,
        })

        const page = await context.newPageAndWaitCsInjected(MOCK_URL)
        await waitForLimitFrame(page)
        await assertOverlayVisible(page)

        await assertOverlayHidden(page, 3000)
    })
})