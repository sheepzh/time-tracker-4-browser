import { getOption } from '@api/sw/option'
import locationWatcher from '@cs/location-watcher'
import Dispatcher from '../dispatcher'
import Countdown from './countdown'
import ModalManager from './manager'
import DelayCoordinator from './manager/delay-coordinator'
import LimitState from './manager/state'
import { DailyWeeklyProcessor, FocusProcessor, PeriodProcessor, VisitProcessor } from './processor'
import Reminder from './reminder'
import type { SharedOption } from './types'

export default async function processLimit(state: LimitState, dispatcher: Dispatcher) {
    const { limitCountdown, limitDelayDuration } = await getOption()
    const option: SharedOption = { countdown: limitCountdown, delayDuration: limitDelayDuration }
    const delayCoord = new DelayCoordinator()

    const dailyWeeklyPsr = new DailyWeeklyProcessor(state, delayCoord, option)
    const visitPsr = new VisitProcessor(state, delayCoord, option)
    const focusPsr = new FocusProcessor(state)
    const periodPsr = new PeriodProcessor(state, delayCoord, option)

    const processors = [dailyWeeklyPsr, visitPsr, periodPsr, focusPsr]
    const resetAll = () => processors.forEach(p => void p.reset())
    await Promise.all(processors.map(p => p.init()))
    locationWatcher.onCurrChange(resetAll)

    new ModalManager().init(state, delayCoord, visitPsr)

    const countdown = new Countdown(option, visitPsr)
    countdown.init(state)
    const reminder = new Reminder()

    dispatcher
        .register('limitChanged', resetAll)
        .register('limitTimeMeet', items => dailyWeeklyPsr.onTimeMeet(items))
        .register('limitReminder', data => reminder.show(data))
        .register('limitOptionChanged', ({ limitCountdown, limitDelayDuration }) => {
            option.countdown = limitCountdown
            option.delayDuration = limitDelayDuration
            void countdown.sync()
        })
        .register('askVisitHit', ruleId => state.reasons.some(r => r.type === 'VISIT' && ruleId === r.id))
        .register('focusChanged', session => focusPsr.onFocusChanged(session))
}
