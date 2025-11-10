/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { trySendMsg2Runtime } from "@api/chrome/runtime"
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
        const flag = document.createElement('a')
        flag.href = '#'
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
        onReport: data => trySendMsg2Runtime('cs.trackTime', data),
        onResume: reason => reason === 'idle' && trySendMsg2Runtime('cs.idleChange', false),
        onPause: reason => reason === 'idle' && trySendMsg2Runtime('cs.idleChange', true),
    })
    normalTracker.init()
    const runTimeTracker = new RunTimeTracker(url)
    runTimeTracker.init()

    // Execute only one time for each dom
    if (getOrSetFlag()) return
    if (!host) return

    const isWhitelist = await trySendMsg2Runtime('cs.isInWhitelist', { host, url })
    if (isWhitelist) return

    await initLocale()
    const needPrintInfo = await trySendMsg2Runtime('cs.printTodayInfo')
    !!needPrintInfo && printInfo(host)
    await processLimit(url)

    processTimeline()

    // Increase visit count at the end
    await trySendMsg2Runtime('cs.incVisitCount', { host, url })
}

main()