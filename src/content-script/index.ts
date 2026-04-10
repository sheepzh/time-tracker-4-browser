/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { trySendMsg2Runtime } from '@api/sw/common'
import { initLocale } from "@i18n"
import processLimit from "./limit"
import printInfo from "./printer"
import processTimeline from './timeline'
import NormalTracker from "./tracker/normal"
import RunTimeTracker from "./tracker/run-time"

const host = document?.location?.host
const url = document?.location?.href

const FLAG_ID = '__TIMER_INJECTION_FLAG__' + chrome.runtime.id

function getOrSetFlag(): boolean {
    const pre = document?.getElementById(FLAG_ID)
    if (!pre) {
        const flag = document.createElement('span')
        flag.style && (flag.style.visibility = 'hidden')
        flag && (flag.id = FLAG_ID)

        if (document.readyState === "complete") {
            document?.body?.appendChild(flag)
        } else {
            const oldListener = document.onreadystatechange
            document.onreadystatechange = function (ev) {
                oldListener?.call(this, ev)
                document.readyState === "complete" && document?.body?.appendChild(flag)
            }
        }
    }
    return !!pre
}

async function main() {
    // Execute in every injections
    const normalTracker = new NormalTracker({
        onReport: data => trySendMsg2Runtime('track.time', data),
        onResume: reason => reason === 'idle' && trySendMsg2Runtime('cs.idleChanged', false),
        onPause: reason => reason === 'idle' && trySendMsg2Runtime('cs.idleChanged', true),
    })
    normalTracker.init()
    const runTimeTracker = new RunTimeTracker(url)
    runTimeTracker.init()

    // Execute only one time for each dom
    if (getOrSetFlag()) return
    if (!host) return

    const isWhitelist = await trySendMsg2Runtime('whitelist.contain', { host, url })
    if (isWhitelist) return

    await initLocale()
    printInfo(host)
    await processLimit(url)

    processTimeline()

    // Increase visit count at the end
    await trySendMsg2Runtime('track.visit')
}

main()
