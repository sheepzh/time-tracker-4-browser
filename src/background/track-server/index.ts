import { IS_ANDROID, IS_FIREFOX } from '@util/constant/environment'
import type MessageDispatcher from "../message-dispatcher"
import FileTracker from './file-tracker'
import { initTabGroup } from './group'
import { handleTrackTimeEvent, incVisitCount } from './normal'
import { handleTrackRunTimeEvent } from './runtime'

export default function initTrackServer(messageDispatcher: MessageDispatcher) {
    messageDispatcher
        .register('track.time', (ev, { tab, url }) => handleTrackTimeEvent(ev, url, tab))
        .register('track.runTime', (ev, { url }) => handleTrackRunTimeEvent(ev, url))
        .register('track.visit', (_, { tab }) => incVisitCount(tab))

    initTabGroup()

    // Track file time in background script for FF
    // Not accurate, since can't detect if the tabs are active or not
    IS_FIREFOX && !IS_ANDROID && new FileTracker().init()
}
