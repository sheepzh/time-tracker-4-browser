import { IS_ANDROID, IS_FIREFOX } from '@util/constant/environment'
import { isFileUrl } from '@util/pattern'
import type MessageDispatcher from "../message-dispatcher"
import FileTracker from './file-tracker'
import { initTabGroup } from './group'
import { handleTrackTimeEvent } from './normal'
import { handleTrackRunTimeEvent } from './runtime'

export default function initTrackServer(messageDispatcher: MessageDispatcher) {
    messageDispatcher
        .register('track.time', async (ev, { tab }) => {
            const url = tab?.url
            // Not to process event from FF file tab
            if (IS_FIREFOX && url && isFileUrl(url)) return
            await handleTrackTimeEvent(ev, tab)
        })
        .register('track.runTime', (ev, { url }) => handleTrackRunTimeEvent(ev, url))

    initTabGroup()

    // Track file time in background script for FF
    // Not accurate, since can't detect if the tabs are active or not
    IS_FIREFOX && !IS_ANDROID && new FileTracker().init()
}
