import { trySendMsg2Runtime } from '@api/sw/common'
import { getOption } from '@api/sw/option'
import LocationWatcher from '../location-watcher'
import Dispatcher from '../dispatcher'
import ModalInstance from './modal/instance'
import MessageAdaptor from './processor/message-adaptor'
import PeriodProcessor from './processor/period-processor'
import VisitProcessor from './processor/visit-processor'
import Reminder from './reminder'
import type { ModalContext, Processor } from './types'

const getHost = (url: string): string | undefined => {
    try {
        return new URL(url).host
    } catch {
        return undefined
    }
}

const isWhitelisted = async (url: string): Promise<boolean> => {
    const host = getHost(url)
    if (!host) return true
    return !!await trySendMsg2Runtime('whitelist.contain', { host, url })
}

export default async function processLimit(url: string, dispatcher: Dispatcher) {
    const { limitDelayDuration: delayDuration } = await getOption()
    const modal = new ModalInstance(url)
    const context: ModalContext = { modal, url: '' }

    const messageAdaptor = new MessageAdaptor(context, delayDuration)
    const visitProcessor = new VisitProcessor(context, delayDuration)

    const processors: Processor[] = [
        messageAdaptor,
        visitProcessor,
        new PeriodProcessor(context),
    ]
    await Promise.all(processors.map(p => p.init()))

    let active = false
    let refreshId = 0
    const refreshUrl = async (nextUrl: string): Promise<void> => {
        if (!nextUrl) return
        const currentRefreshId = ++refreshId
        const prevUrl = context.url
        context.url = nextUrl
        modal.setUrl(nextUrl)
        active = false
        const whitelisted = await isWhitelisted(nextUrl)
        if (currentRefreshId !== refreshId) return

        await Promise.all(processors.map(p => p.onUrlRefreshed({ prevUrl, nextUrl, whitelisted })))
        if (currentRefreshId !== refreshId) return
        active = !whitelisted
    }

    await refreshUrl(url)
    new LocationWatcher(url, nextUrl => void refreshUrl(nextUrl)).init()

    const reminder = new Reminder()

    dispatcher
        .register('limitChanged', () => void refreshUrl(context.url))
        .register('limitTimeMeet', items => {
            if (active) void messageAdaptor.onLimitTimeMeet(items)
            return undefined
        })
        .register('limitReminder', data => void reminder.show(data))
        .register('askVisitHit', ruleId => modal.reasons.some(r => r.type === 'VISIT' && ruleId === r.id))
        .registerAudibleChange(visitProcessor.tracker)

    return visitProcessor.tracker
}
