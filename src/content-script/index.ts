/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { trySendMsg2Runtime } from '@api/sw/common'
import { initLocale } from "@i18n"
import './focus-notice'
import Dispatcher from './dispatcher'
import processLimit from "./limit"
import LimitState from './limit/manager/state'
import LocationWatcher from './location-watcher'
import printInfo from "./printer"
import processTimeline from './timeline'
import MediaTimeTracker from './tracker/media-time'
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
    const limitState = new LimitState()

    const location = new LocationWatcher()
    await location.init(dispatcher)

    // Execute in every injection
    const normalTracker = new NormalTracker({
        onReport: async data => void (!location.isWhite && await trySendMsg2Runtime('track.time', data)),
        onResume: () => trySendMsg2Runtime('cs.trackingPauseChanged', false),
        onPause: () => trySendMsg2Runtime('cs.trackingPauseChanged', true),
    })
    normalTracker.init(dispatcher, limitState)

    new RunTimeTracker(location).init()
    new MediaTimeTracker(location).init(dispatcher)

    // Execute only one time for each dom
    if (getOrSetFlag()) return

    void initLocale()
    await processLimit(limitState, location, dispatcher)
    if (location.isWhite) return

    void printInfo(location.host)
    processTimeline()

    // Increase visit count at the end
    await trySendMsg2Runtime('cs.injected')
}

void main()
