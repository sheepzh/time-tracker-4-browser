import itemService from "@service/item-service"
import { IS_ANDROID, IS_FIREFOX } from '@util/constant/environment'
import { isFileUrl } from '@util/pattern'
import type MessageDispatcher from "../message-dispatcher"
import FileTracker from './file-tracker'
import { handleTabGroupEnabled } from './group'
import { handleIncVisitEvent, handleTrackTimeEvent } from './normal'
import { handleTrackRunTimeEvent } from './runtime'

export default function initTrackServer(messageDispatcher: MessageDispatcher) {
    messageDispatcher
        .register<timer.core.Event, void>('cs.trackTime', (ev, sender) => {
            // not to process cs events from local files for FF
            if (IS_FIREFOX && isFileUrl(ev.url)) return

            handleTrackTimeEvent(ev, sender.tab)
        })
        .register<timer.core.Event, void>('cs.trackRunTime', handleTrackRunTimeEvent)
        .register<{ host: string, url: string }, void>('cs.incVisitCount', handleIncVisitEvent)
        .register<string, timer.core.Result>('cs.getTodayInfo', host => itemService.getResult(host, new Date()))
        .register<void, void>('enableTabGroup', handleTabGroupEnabled)

    // Track file time in background script for FF
    // Not accurate, since can't detect if the tabs are active or not
    IS_FIREFOX && !IS_ANDROID && new FileTracker().init()
}
