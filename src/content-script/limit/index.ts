import { getOption } from '@api/sw/option'
import Dispatcher from '../dispatcher'
import LocationWatcher from '../location-watcher'
import Countdown from './countdown'
import ModalManager from './manager'
import DelayCoordinator from './manager/delay-coordinator'
import LimitState from './manager/state'
import { DailyWeeklyProcessor, FocusProcessor, PeriodProcessor, VisitProcessor } from './processor'
import Reminder from './reminder'

export default async function processLimit(state: LimitState, location: LocationWatcher, dispatcher: Dispatcher) {
    const option = await getOption()
    const { limitDelayDuration: delayDuration } = option
    const delayCoord = new DelayCoordinator()

    const dailyWeeklyPsr = new DailyWeeklyProcessor(state, delayCoord, location, delayDuration)
    const visitPsr = new VisitProcessor(dispatcher, state, delayCoord, location, delayDuration)
    const focusPsr = new FocusProcessor(state, location)
    const periodPsr = new PeriodProcessor(state, delayCoord, location, delayDuration)

    const processors = [dailyWeeklyPsr, visitPsr, periodPsr, focusPsr]
    await Promise.all(processors.map(p => p.init()))
    location.onCurrChange(() => void processors.forEach(p => void p.reset()))

    new ModalManager(location).init(state, delayCoord, visitPsr)

    const countdown = new Countdown(location, option)
    await countdown.init(state, visitPsr, delayCoord)
    const reminder = new Reminder()

    dispatcher
        .register('limitChanged', () => processors.forEach(p => void p.reset()))
        .register('limitTimeMeet', items => dailyWeeklyPsr.onTimeMeet(items))
        .register('limitReminder', data => reminder.show(data))
        .register('limitCountdownChanged', () => countdown.fetchOption())
        .register('askVisitHit', ruleId => state.reasons.some(r => r.type === 'VISIT' && ruleId === r.id))
        .register('focusChanged', session => focusPsr.onFocusChanged(session))
}
