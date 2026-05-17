import { type LaunchContext } from "./base"
import { sleep } from './util'

export async function createWhitelist(context: LaunchContext, white: string) {
    const whitePage = await context.openAppPage('/site-rule/whitelist')

    const btn = await whitePage.waitForSelector('.el-button')
    await btn?.click()
    await sleep(.2)

    const input = await whitePage.$('.el-select__input')
    await input?.focus()
    await whitePage.keyboard.type(white)
    await sleep(.4)
    await whitePage.keyboard.press('ArrowDown')
    await sleep(.2)
    await whitePage.keyboard.press('Enter')

    await whitePage.click('.el-button:nth-child(3)')
    const checkBtn = await whitePage.waitForSelector('.el-overlay.is-message-box .el-button.el-button--primary')
    await checkBtn?.click()
    setTimeout(() => whitePage.close(), 200)
}

export async function removeAllWhitelist(context: LaunchContext) {
    const whitePage = await context.openAppPage('/site-rule/whitelist')
    await whitePage.evaluate(async () => {
        await chrome.storage.local.remove('__timer__WHITELIST')
    })
    await whitePage.close()
}