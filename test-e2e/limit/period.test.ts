import { useLaunchContext } from '../common/base'
import { assertOverlayHidden, assertOverlayVisible, waitForLimitFrame } from '../common/overlay'
import { MOCK_URL, sleep } from '../common/util'
import { clickDelay, createLimitRule } from './common'

function computeActivePeriod(): tt4b.limit.Period {
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const start = (nowMinutes - 5 + 1440) % 1440
    const end = (nowMinutes + 5) % 1440
    return [start, end]
}

describe("Period limit", () => {
    const context = useLaunchContext()

    test("Basic", async () => {
        // 1. create rule
        const limitPage = await context.openAppPage('/productivity/limit')
        const period = computeActivePeriod()
        const demoRule: tt4b.limit.Rule = {
            id: 1, name: 'TEST PERIOD LIMIT',
            cond: [MOCK_URL],
            periods: [period],
            enabled: true, allowDelay: false, locked: false,
        }
        await createLimitRule(demoRule, limitPage)
        // 2. assert the mask appear
        const testPage = await context.newPageAndWaitCsInjected(MOCK_URL)
        await assertOverlayVisible(testPage)
        // 3. disable rule
        await limitPage.bringToFront()
        await sleep(.1)
        await limitPage.evaluate(() => {
            document.querySelector<HTMLElement>('.el-table__body .el-table__row td:nth-child(8) .el-switch')?.click()
        })
        await sleep(.3)
        // 4. assert the mask disappear
        await testPage.bringToFront()
        await assertOverlayHidden(testPage)
        // 5. enable rule
        await limitPage.bringToFront()
        await sleep(.1)
        await limitPage.evaluate(() => {
            document.querySelector<HTMLElement>('.el-table__body .el-table__row td:nth-child(8) .el-switch')?.click()
        })
        await sleep(.3)
        // 6. assert the mask appear again
        await testPage.bringToFront()
        await assertOverlayVisible(testPage)
        // 7. delete rule
        await limitPage.bringToFront()
        await sleep(.1)
        await limitPage.evaluate(() => {
            document.querySelector<HTMLElement>('.el-table__body .el-table__row .el-button--danger')?.click()
        })
        await sleep(.2)
        await limitPage.evaluate(() => {
            document.querySelector<HTMLElement>('.el-message-box .el-button--primary')?.click()
        })
        await sleep(.3)
        // 8. assert the mask disappear
        await testPage.bringToFront()
        await assertOverlayHidden(testPage)
    }, 30_000)

    test("Unblock period", async () => {
        // 1. create rule
        const limitPage = await context.openAppPage('/productivity/limit')
        const period = computeActivePeriod()
        const demoRule: tt4b.limit.Rule = {
            id: 1, name: 'TEST PERIOD UNBLOCK',
            cond: [MOCK_URL],
            periods: [period],
            enabled: true, allowDelay: false, locked: false,
        }
        await createLimitRule(demoRule, limitPage)
        // 2. assert the mask appear
        const testPage = await context.newPageAndWaitCsInjected(MOCK_URL)
        await assertOverlayVisible(testPage)
        // 3. enable unblocking for the rule
        await limitPage.bringToFront()
        await sleep(.1)
        await limitPage.evaluate(() => {
            const switches = document.querySelectorAll<HTMLElement>('.el-table__body .el-table__row td .el-switch')
            switches[1]?.click()
        })
        await sleep(.3)
        // 4. assert the unblocking button visible
        await testPage.bringToFront()
        const limitFrame = await waitForLimitFrame(testPage)
        await limitFrame.waitForSelector('.el-button--primary', { visible: true, timeout: 5000 })
        // 5. click the unblocking button
        await clickDelay(testPage)
        //6. assert the mask disappear
        await assertOverlayHidden(testPage)
    }, 30_000)
})
