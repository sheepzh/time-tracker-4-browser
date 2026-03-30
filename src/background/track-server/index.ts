import { IS_ANDROID, IS_FIREFOX } from '@util/constant/environment'
import { isFileUrl } from '@util/pattern'
import type MessageDispatcher from "../message-dispatcher"
import FileTracker from './file-tracker'
import { initTabGroup } from './group'
import { handleIncVisitEvent, handleTrackTimeEvent } from './normal'
import { handleTrackRunTimeEvent } from './runtime'

export default function initTrackServer(messageDispatcher: MessageDispatcher) {
    messageDispatcher
        .register('cs.trackTime', (ev, sender) => {
            // not to process cs events from local files for FF
            if (IS_FIREFOX && isFileUrl(ev.url)) return

            handleTrackTimeEvent(ev, sender.tab)
        })
        .register('cs.trackRunTime', handleTrackRunTimeEvent)
        .register('cs.incVisitCount', handleIncVisitEvent)

    initTabGroup()

    // Track file time in background script for FF
    // Not accurate, since can't detect if the tabs are active or not
    IS_FIREFOX && !IS_ANDROID && new FileTracker().init()
}
