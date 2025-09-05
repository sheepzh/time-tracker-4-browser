import { launchBrowser, type LaunchContext, MOCK_URL, sleep } from "../common/base"
import { createLimitRule } from "./common"

let context: LaunchContext

describe('Daily time limit', () => {
    beforeEach(async () => context = await launchBrowser())

    afterEach(() => context.close())

    test("Daily visit limit", async () => {
        const limitPage = await context.openAppPage('/behavior/limit')
        const demoRule: timer.limit.Rule = {
            id: 1, name: 'TEST DAILY LIMIT',
            cond: [MOCK_URL],
            time: 0, count: 1,
            enabled: true, allowDelay: false, locked: false,
        }

        // 1. Insert limit rule
        await createLimitRule(demoRule, limitPage)

        // 2. Open test page
        const testPage = await context.newPageAndWaitCsInjected(MOCK_URL)

        // Assert not limited
        await limitPage.bringToFront()
        // Wait refreshing the table
        await sleep(.1)
        const infoTag = await limitPage.$$('.el-table .el-table__body-wrapper table tbody tr td:nth-child(6) .el-tag.el-tag--info')
        expect(infoTag.length).toEqual(2)

        // 3. Reload page
        await testPage.bringToFront()
        await testPage.reload({ waitUntil: 'domcontentloaded' })

        // Waiting for limit message handling
        await sleep(2)
        const { name, count } = await testPage.evaluate(async () => {
            const shadow = document.querySelector('extension-time-tracker-overlay')
            if (!shadow) return {}
            const descEl = shadow!.shadowRoot!.querySelector('#app .el-descriptions:not([style*="display: none"])')
            const trs = descEl!.querySelectorAll('tr')
            const name = trs[0].querySelector('td:nth-child(2)')!.textContent
            const count = trs[3].querySelector('td:nth-child(2) .el-tag--danger')!.textContent
            return { name, count }
        })

        expect(name).toBe(demoRule.name)
        expect(count!.split?.(' ')[0]).toBe('2')

        // 4. Change visit limit
        await limitPage.bringToFront()
        await limitPage.click('.el-card__body .el-table tr td .el-button--primary')

        await sleep(.1)
        await limitPage.click('.el-dialog .el-button.el-button--primary')

        await sleep(.1)
        await limitPage.click('.el-dialog .el-button.el-button--primary')

        await sleep(.1)
        const visitInput = await limitPage.$('.el-dialog .el-input-number input')
        await visitInput!.focus()
        await limitPage.keyboard.type('2')
        await limitPage.click('.el-dialog .el-button.el-button--success')

        // 5. The modal disappear
        await testPage.bringToFront()
        await sleep(.5)
        const modalExist = await testPage.evaluate(() => {
            const shadow = document.querySelector('extension-time-tracker-overlay')
            if (!shadow) return false
            return !!shadow!.shadowRoot!.querySelector('body:not([style*="display: none"])')
        })
        expect(modalExist).toBeFalsy()
    }, 60000)
})