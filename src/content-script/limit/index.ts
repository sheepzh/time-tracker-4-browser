import { getOption } from '@api/sw/option'
import Dispatcher from '../dispatcher'
import ModalInstance from "./modal/instance"
import MessageAdaptor from './processor/message-adaptor'
import PeriodProcessor from "./processor/period-processor"
import VisitProcessor from "./processor/visit-processor"
import Reminder from './reminder'
import type { ModalContext, Processor } from './types'

export default async function processLimit(url: string, dispatcher: Dispatcher) {
    const { limitDelayDuration: delayDuration } = await getOption()
    const modal = new ModalInstance(url)
    const context: ModalContext = { modal, url }

    const mesageAdaptor = new MessageAdaptor(context, delayDuration)
    const visitProcessor = new VisitProcessor(context, delayDuration)

    const processors: Processor[] = [
        mesageAdaptor,
        visitProcessor,
        new PeriodProcessor(context),
    ]
    await Promise.all(processors.map(p => p.init()))

    const reminder = new Reminder()

    dispatcher
        .register('limitChanged', () => void processors.forEach(p => p.onLimitChanged()))
        .register('limitTimeMeet', items => void mesageAdaptor.onLimitTimeMeet(items))
        .register('limitReminder', data => void reminder.show(data))
        .register('askVisitHit', ruleId => modal.reasons.some(r => r.type === 'VISIT' && ruleId === r.id))
        .registerAudibleChange(visitProcessor.tracker)

    return visitProcessor.tracker
}
