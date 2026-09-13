/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { trySendMsg2Runtime } from '@api/sw/common'
import { initLocale } from "@i18n"
import { appendToBody } from '@util/document'
import audible from './audible'
import Dispatcher from './dispatcher'
import processLimit from "./limit"
import LimitState from './limit/manager/state'
import locationWatcher from './location-watcher'
import printInfo from "./printer"
import TimelineCollector from './timeline'
import NormalTracker from "./tracker/normal"
import OptionalTracker from './tracker/optional'

const FLAG_ID = '__TIMER_INJECTION_FLAG__' + chrome.runtime.id

function getOrSetFlag(): boolean {
    const existed = document?.getElementById(FLAG_ID)
    if (existed) return true

    const flag = document.createElement('span')
    flag.style.visibility = 'hidden'
    flag.id = FLAG_ID

    appendToBody(flag)
    return false
}

async function main() {
    const dispatcher = new Dispatcher()
    await audible.init(dispatcher)
    const limitState = new LimitState()

    await locationWatcher.init(dispatcher)

    // Execute in every injection
    new NormalTracker({
        onReport: async data => { !locationWatcher.isWhite && await trySendMsg2Runtime('track.time', data) },
        onResume: () => trySendMsg2Runtime('cs.trackingPauseChanged', false),
        onPause: () => trySendMsg2Runtime('cs.trackingPauseChanged', true),
    }).init(limitState)
    new OptionalTracker().init()

    // Execute only one time for each dom
    if (getOrSetFlag()) return

    await initLocale()
    await processLimit(limitState, dispatcher)
    if (locationWatcher.isWhite) return

    await printInfo()
    new TimelineCollector().init()

    // Increase visit count at the end
    await trySendMsg2Runtime('cs.injected')
}

await main()
