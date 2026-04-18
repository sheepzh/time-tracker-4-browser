import { formatTimeYMD, MILL_PER_SECOND } from '@util/time'
import type { Page } from 'puppeteer'
import { launchBrowser, type LaunchContext } from '../common/base'
import { MOCK_URL, sleep } from '../common/util'
import { clickDelay, createLimitRule, isLimitModalVisible } from './common'

async function setDelayDuration(page: Page, value: number) {
    const delayInput = await page.waitForSelector('.el-input-number input')
    await delayInput!.click({ count: 3 })
    await page.keyboard.press('Backspace')
    await page.keyboard.type(`${value}`)
    await page.keyboard.press('Enter')
    await sleep(.2)
}

async function findRuleId(page: Page): Promise<number> {
    return page.evaluate(
        ruleName => new Promise<number>((resolve, reject) => {
            chrome.runtime.sendMessage({ code: 'limit.list', data: undefined }, (res: {
                code?: string
                data?: timer.limit.Item[]
                msg?: string
            }) => {
                if (res?.code !== 'success') return reject(new Error(res?.msg ?? 'limit.list failed'))
                const id = res.data?.find(r => r.name === ruleName)?.id
                typeof id === 'number' ? resolve(id) : reject(new Error('rule id not found'))
            })
        }),
        DEMO_RULE.name,
    )
}

async function setTodayWaste(page: Page, ruleId: number, mill: number) {
    const today = formatTimeYMD(new Date())
    await page.evaluate(
        async (id, m, date) => {
            const key = '__timer__LIMIT'
            const bag = await chrome.storage.local.get(key)
            const items = (bag[key] ?? {}) as Record<string, { r?: Record<string, { m?: number; c?: number; d?: number }> }>
            const row = items[String(id)]
            if (!row) throw new Error('limit row missing in storage')
            const prev = row.r?.[date] ?? { m: 0, c: 0 }
            row.r = row.r ?? {}
            row.r[date] = { ...prev, m }
            await chrome.storage.local.set({ [key]: items })
        },
        ruleId, mill, today,
    )
}

const DEMO_RULE = {
    id: 1,
    name: 'DELAY DURATION',
    cond: [MOCK_URL],
    time: 1,
    enabled: true,
    allowDelay: true,
    locked: false,
} as const satisfies timer.limit.Rule

describe('Limit delay duration', () => {
    let context: LaunchContext

    beforeEach(async () => { context = await launchBrowser() })

    // afterEach(() => context.close())

    test('Delay with customized duration', async () => {
        const optionPage = await context.openAppPage('/additional/option?i=limit')
        await setDelayDuration(optionPage, 1)

        const limitPage = await context.openAppPage('/behavior/limit')
        await createLimitRule(DEMO_RULE, limitPage)

        const ruleId = await findRuleId(limitPage)
        // 61 seconds, more than 1 minute delay
        await setTodayWaste(limitPage, ruleId, 61 * MILL_PER_SECOND)

        const testPage = await context.newPageAndWaitCsInjected(MOCK_URL)
        await sleep(1)

        expect(await isLimitModalVisible(testPage)).toBeTruthy()

        await clickDelay(testPage)

        // Not disappear if only delay once (1 minute delay)
        expect(await isLimitModalVisible(testPage)).toBeTruthy()

        // Disappear if delay twice (2 minutes delay)
        await clickDelay(testPage)
        expect(await isLimitModalVisible(testPage)).toBeFalsy()
    }, 45000)
})
