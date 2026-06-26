import { type LaunchContext } from "./base"
import { fillCondEditor } from './cond-editor'
import { sleep } from './util'

export async function createWhitelist(context: LaunchContext, white: string) {
    const whitePage = await context.openAppPage('/tracking/rule?i=white')

    await fillCondEditor(whitePage, [white])
    await sleep(.2)

    setTimeout(() => whitePage.close(), 200)
}

export async function removeAllWhitelist(context: LaunchContext) {
    const whitePage = await context.openAppPage('/tracking/rule?i=white')
    await whitePage.evaluate(async () => {
        await chrome.storage.local.remove('__timer__WHITELIST')
    })
    await whitePage.close()
}