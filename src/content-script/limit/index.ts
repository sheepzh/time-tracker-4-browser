import { getOption } from '@api/sw/option'
import Dispatcher from '../dispatcher'
import LocationWatcher from '../location-watcher'
import ModalInstance from './modal/instance'
import MessageAdaptor from './processor/message-adaptor'
import PeriodProcessor from './processor/period-processor'
import VisitProcessor from './processor/visit-processor'
import Reminder from './reminder'
import type { Processor } from './types'

export default async function processLimit(location: LocationWatcher, dispatcher: Dispatcher) {
    const { limitDelayDuration: delayDuration } = await getOption()
    const modal = new ModalInstance(location)

    const messageAdaptor = new MessageAdaptor(modal, location, delayDuration)
    const visitProcessor = new VisitProcessor(modal, location, delayDuration)

    const processors: Processor[] = [
        messageAdaptor,
        visitProcessor,
        new PeriodProcessor(modal, location),
    ]
    await Promise.all(processors.map(p => p.init()))
    location.onChange(() => void processors.forEach(p => void p.reset()))

    const reminder = new Reminder()

    dispatcher
        .register('limitChanged', () => void processors.forEach(p => void p.reset()))
        .register('limitTimeMeet', items => void messageAdaptor.onLimitTimeMeet(items))
        .register('limitReminder', data => void reminder.show(data))
        .register('askVisitHit', ruleId => modal.reasons.some(r => r.type === 'VISIT' && ruleId === r.id))
        .registerAudibleChange(visitProcessor.tracker)

    return visitProcessor.tracker
}
