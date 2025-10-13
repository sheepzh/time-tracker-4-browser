import { type LaunchContext, sleep } from "./base"

export async function createWhitelist(context: LaunchContext, white: string) {
    const whitePage = await context.openAppPage('/additional/whitelist')

    const btn = await whitePage.waitForSelector('.el-button')
    await btn?.click()
    await sleep(.2)

    const input = await whitePage.$('.el-select__input')
    await input?.focus()
    await whitePage.keyboard.type(white)
    await sleep(.4)
    const selectItem = await whitePage.waitForSelector('.el-popper .el-select-dropdown li:nth-child(1)')
    await selectItem?.click()
    await whitePage.click('.el-button:nth-child(3)')
    const checkBtn = await whitePage.waitForSelector('.el-overlay.is-message-box .el-button.el-button--primary')
    await checkBtn?.click()
    setTimeout(() => whitePage.close(), 200)
}