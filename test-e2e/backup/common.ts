import type { ElementHandle, Page } from 'puppeteer'
import { type LaunchContext } from '../common/base'
import { waitForMessage, waitForSuccMessage } from '../common/message'
import { sleep } from '../common/util'

const typeNames: Record<timer.backup.Type, string> = {
    gist: 'gist',
    web_dav: 'dav',
    obsidian_local_rest_api: 'obsidian',
    none: 'none',
}

const OPTION_TAB_ID = 'pane-backup'

async function waitClientReady(page: Page): Promise<ElementHandle<Element> | null> {
    await page.waitForFunction(() => {
        const emptyBody = document.querySelector('.el-dialog .el-table__empty-block')
        const rows = document.querySelectorAll('.el-dialog .el-table .el-table__row')
        return !!emptyBody || !!rows.length
    }, { timeout: 1000 })

    const nextBtn = await page.waitForSelector(
        '.el-overlay:not([style*="display: none"]) .el-dialog .el-button.el-button--primary:not([disabled])',
        { timeout: 1000 },
    )
    return nextBtn
}

async function findCurrentClientRow(page: Page): Promise<ElementHandle<Element> | null> {
    const table = await page.waitForSelector(
        '.el-overlay:not([style*="display: none"]) .el-dialog .el-table',
        { timeout: 2000 },
    )
    const rows = await table!.$$('.el-table__row')

    for (const row of rows) {
        const currVisible = await row.evaluate(el => {
            const tag = el.querySelector('.el-table__cell .el-tag')
            if (!tag) return false
            const text = tag.textContent
            if (!text.toLowerCase().includes('current')) return false
            const style = window.getComputedStyle(tag)
            return style && style.display !== 'none'
        })
        if (currVisible) return row
    }
    return null
}

async function selectCurrentClient(page: Page): Promise<void> {
    const currRow = await findCurrentClientRow(page)
    expect(currRow).toBeTruthy()
    await currRow!.click()
    await sleep(.1)
}

export class BackupOptionWrapper {
    private _page: Page | undefined

    constructor(private context: LaunchContext) { }

    private async page() {
        if (this._page) {
            await this._page.bringToFront()
            return this._page
        }
        this._page = await this.context.openAppPage('/additional/option?i=backup')
        return this._page
    }

    async $(selector: string) {
        const page = await this.page()
        return await page.$(`#${OPTION_TAB_ID} ${selector}`)
    }

    async changeType(type: timer.backup.Type) {
        const page = await this.page()
        const pane = await page.$(`#${OPTION_TAB_ID} .el-select`)
        await pane?.click()
        await sleep(.1)

        const backupOptions = await page.$$('.el-popper[data-popper-reference-hidden="false"] .el-select-dropdown__item')

        const labelPart = typeNames[type]
        for (const option of backupOptions) {
            const text = await option.evaluate(el => el.textContent)
            if (text?.toLowerCase().includes(labelPart)) {
                await option.click()
                break
            }
        }
        await sleep(.1)

        return page
    }

    async assertTestInvalid() {
        const page = await this.clickButton('test')
        // The same as mock server
        await waitForMessage(page, 'Unauthorized')
    }

    async assertTestValid() {
        const page = await this.clickButton('test')
        await waitForMessage(page, 'Valid!')
    }

    async assertBackupSuccess() {
        const page = await this.clickButton('backup')

        // Wait for the success message
        await waitForSuccMessage(page)

        const lastSyncTime = await this.findLastSyncTime()
        expect(lastSyncTime).toBeTruthy()
        // Less than 2 seconds
        expect(Date.now() - lastSyncTime!.getTime()).toBeLessThan(2 * 1000)
    }

    private async clickButton(textPart: string): Promise<Page> {
        const page = await this.page()
        const buttons = await page.$$(`#${OPTION_TAB_ID} .el-button`)
        for (const button of buttons) {
            const text = await button.evaluate(el => el.textContent)
            if (text?.toLowerCase().includes(textPart.toLowerCase())) {
                await button.click()
                return page
            }
        }
        throw new Error(`Button with text "${textPart}" not found`)
    }

    private async findLastSyncTime() {
        const page = await this.page()
        const texts = await page.$$(`#${OPTION_TAB_ID} .el-text`)
        for (const textEl of texts) {
            const text = await textEl.evaluate(el => el.textContent)
            const matchRes = /(?<M>\d{2})\/(?<d>\d{2})\/(?<y>\d{4}) (?<h>\d{2}):(?<m>\d{2}):(?<s>\d{2})/.exec(text ?? '')
            if (!matchRes) continue
            const groups = matchRes.groups
            if (!groups) continue
            const { M, d, y, h, m, s } = groups
            if (!y || !M || !d || !h || !m || !s) continue
            return new Date(
                Number.parseInt(y), Number.parseInt(M) - 1, Number.parseInt(d),
                Number.parseInt(h), Number.parseInt(m), Number.parseInt(s),
            )
        }
        return undefined
    }

    async downloadCurrentWithAcc() {
        // Open dialog
        const page = await this.clickButton('download')

        const nextBtn = await waitClientReady(page)

        // Select current client row
        await selectCurrentClient(page)

        // Next step
        await nextBtn!.click()

        // Wait for download enabled
        const downloadBtn = await page.waitForSelector('.el-dialog .el-button.el-button--success:not([disabled])', { timeout: 1000 })

        // Choose the solution
        const solutionRadio = await page.waitForSelector('.el-dialog .el-radio-group > label:nth-child(2)', { timeout: 1000 })
        await solutionRadio!.click()

        // Do downloading
        await downloadBtn!.click()

        await waitForSuccMessage(page)
    }

    async clearData() {
        const page = await this.clickButton('clear')

        const nextBtn = await waitClientReady(page)

        // Select current client row
        await selectCurrentClient(page)

        // Next step
        await nextBtn!.click()

        // Wait for clear enabled
        const clearBtn = await page.waitForSelector('.el-dialog .el-button.el-button--danger:not([disabled])', { timeout: 1000 })

        await clearBtn!.click()

        await waitForSuccMessage(page)
    }

    async assertCantDownloadCurr() {
        // Open dialog
        const page = await this.clickButton('download')

        await waitClientReady(page)

        // Select current client row
        const currRow = await findCurrentClientRow(page)
        expect(currRow).toBeFalsy()
    }
}