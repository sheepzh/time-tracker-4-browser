/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { trySendMsg2Runtime } from '@api/sw/common'
import { initLocale } from "@i18n"
import Dispatcher from './dispatcher'
import processLimit from "./limit"
import LocationWatcher from './location-watcher'
import printInfo from "./printer"
import processTimeline from './timeline'
import NormalTracker from "./tracker/normal"
import RunTimeTracker from "./tracker/run-time"

const FLAG_ID = '__TIMER_INJECTION_FLAG__' + chrome.runtime.id

function getOrSetFlag(): boolean {
    const existed = document?.getElementById(FLAG_ID)
    if (existed) return true

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
    return false
}

async function main() {
    const dispatcher = new Dispatcher()

    // Execute in every injection
    const normalTracker = new NormalTracker({
        onReport: data => trySendMsg2Runtime('track.time', data),
        onResume: reason => reason === 'idle' && trySendMsg2Runtime('cs.idleChanged', false),
        onPause: reason => reason === 'idle' && trySendMsg2Runtime('cs.idleChanged', true),
    })
    normalTracker.init()
    dispatcher.registerAudibleChange(normalTracker)

    const location = new LocationWatcher()
    await location.init()

    new RunTimeTracker(location).init(dispatcher)

    // Execute only one time for each dom
    if (getOrSetFlag()) return

    void initLocale()
    await processLimit(location, dispatcher)
    if (location.whitelisted) return

    void printInfo(location.host)
    processTimeline()

    // Increase visit count at the end
    await trySendMsg2Runtime('cs.injected')
}

void main()
