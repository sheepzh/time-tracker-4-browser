import { useLaunchContext } from '../common/base'
import { assertOverlayHidden, assertOverlayVisible, waitForLimitFrame } from '../common/overlay'
import { MOCK_HOST, MOCK_URL_2 } from '../common/util'
import { getFocusBlockInfo, startSessionViaApi } from './common'

describe('Pomodoro', () => {
    const context = useLaunchContext()

    test('lifecycle', async () => {
        // 1. Start session via API
        const popupPage = await context.openPopupPage('focus')
        await startSessionViaApi(popupPage, {
            method: 'pomodoro',
            policy: 'allow',
            cond: [MOCK_HOST],
            duration: 2,
            break: 1,
        })

        // 2.Reload to pick up session
        const page = await context.newPageAndWaitCsInjected(MOCK_URL_2)
        const frame = await waitForLimitFrame(page)
        const info = await getFocusBlockInfo(frame)
        expect(info.prompt).toContain('Pomodoro')

        // 3. break phase starts after 3 seconds
        await assertOverlayHidden(page, 3000)

        // 4. assert another focus start again
        await assertOverlayVisible(page, 2000)
    })
})