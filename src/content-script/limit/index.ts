import { getOption } from '@api/sw/option'
import Dispatcher from '../dispatcher'
import LocationWatcher from '../location-watcher'
import ModalManager from './manager'
import DelayCoordinator from './manager/delay-coordinator'
import LimitState from './manager/state'
import { DailyWeeklyProcessor, FocusProcessor, PeriodProcessor, VisitProcessor } from './processor'
import Reminder from './reminder'

export default async function processLimit(location: LocationWatcher, dispatcher: Dispatcher) {
    const { limitDelayDuration: delayDuration } = await getOption()
    const state = new LimitState()
    const delayCoord = new DelayCoordinator()

    const dailyWeeklyPsr = new DailyWeeklyProcessor(state, delayCoord, location, delayDuration)
    const visitPsr = new VisitProcessor(state, delayCoord, location, delayDuration)
    const focusPsr = new FocusProcessor(state, location)
    const periodPsr = new PeriodProcessor(state, delayCoord, location, delayDuration)

    const processors = [dailyWeeklyPsr, visitPsr, periodPsr, focusPsr]
    await Promise.all(processors.map(p => p.init()))
    location.onChange(() => void processors.forEach(p => void p.reset()))

    new ModalManager(location).init(state, delayCoord, visitPsr)

    const reminder = new Reminder()

    dispatcher
        .register('limitChanged', () => processors.forEach(p => void p.reset()))
        .register('limitTimeMeet', items => dailyWeeklyPsr.onTimeMeet(items))
        .register('limitReminder', data => reminder.show(data))
        .register('askVisitHit', ruleId => state.reasons.some(r => r.type === 'VISIT' && ruleId === r.id))
        .register('focusChanged', session => focusPsr.onFocusChanged(session))
        .registerAudibleChange(visitPsr)
}
