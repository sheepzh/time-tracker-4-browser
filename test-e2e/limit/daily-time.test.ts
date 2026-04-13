import { launchBrowser, type LaunchContext } from '../common/base'
import { MOCK_URL, sleep } from '../common/util'
import { createLimitRule, fillTimeLimit, isLimitModalVisible, waitForLimitFrame } from "./common"

let context: LaunchContext

describe('Daily time limit', () => {
    beforeEach(async () => { context = await launchBrowser() })

    afterEach(() => context.close())

    test('basic', async () => {
        const limitTime = 2
        const limitPage = await context.openAppPage('/behavior/limit')
        const demoRule: timer.limit.Rule = {
            id: 1, name: 'TEST DAILY LIMIT',
            cond: [MOCK_URL],
            time: limitTime,
            enabled: true, allowDelay: false, locked: false,
        }

        // 1. Insert limit rule
        await createLimitRule(demoRule, limitPage)

        // 2. Open test page
        const testPage = await context.newPageAndWaitCsInjected(MOCK_URL)
        await sleep(1.1)

        // Assert not limited
        await limitPage.bringToFront()
        // Wait refreshing the table
        await sleep(.1)
        let wastedTime = await limitPage.evaluate(() => {
            const timeTag = document.querySelector('.el-table .el-table__body-wrapper table tbody tr td:nth-child(6) .el-tag:first-child')
            const timeStr = timeTag?.textContent
            return parseInt(timeStr?.replace('s', '')?.trim() ?? '0')
        })
        expect(wastedTime).toBeGreaterThanOrEqual(1)

        // 3. Switch to test page again
        await testPage.bringToFront()
        await sleep(2.1)

        // 4. Limited
        const limitFrame = await waitForLimitFrame(testPage)
        await limitFrame.waitForFunction(() => {
            const td = document.querySelector('#app .el-descriptions:not([style*="display: none"]) tr td:nth-child(2)')
            return td?.textContent && td.textContent !== '-'
        }, { timeout: 5000 })
        const { name, time } = await limitFrame.evaluate(() => {
            const descEl = document.querySelector('#app .el-descriptions:not([style*="display: none"])')
            const trs = descEl?.querySelectorAll('tr')
            const name = trs?.[0]?.querySelector('td:nth-child(2)')?.textContent
            const timeStr = trs?.[3]?.querySelector('td:nth-child(2) .el-tag--danger')?.textContent
            return { name, time: parseInt(timeStr?.replace('s', '').trim() ?? '0') }
        })
        expect(name).toEqual(demoRule.name)
        expect(time).toBeGreaterThanOrEqual(limitTime)

        // 5. Check limit page
        await limitPage.bringToFront()
        await sleep(.1)
        wastedTime = await limitPage.evaluate(() => {
            const timeTag = document.querySelector('.el-table .el-table__body-wrapper table tbody tr td:nth-child(6) .el-tag--danger')
            const timeStr = timeTag?.textContent
            return parseInt(timeStr?.replace('s', '').trim() ?? '')
        })
        expect(wastedTime).toBeGreaterThanOrEqual(limitTime)

        // 6. Change daily limit time
        await limitPage.click('.el-card__body .el-table tr td .el-button--primary')

        await sleep(.1)
        await limitPage.click('.el-dialog .el-button.el-button--primary')

        await sleep(.1)
        await limitPage.click('.el-dialog .el-button.el-button--primary')

        await sleep(.1)
        const timeInput = await limitPage.$('.el-dialog .el-date-editor:first-child input')
        await fillTimeLimit(10, timeInput!, limitPage)
        await limitPage.click('.el-dialog .el-button.el-button--success')

        // 7. Modal disappear
        await testPage.bringToFront()
        await sleep(.5)
        const modalExist = await isLimitModalVisible(testPage)
        expect(modalExist).toBeFalsy()
    }, 60000)
})