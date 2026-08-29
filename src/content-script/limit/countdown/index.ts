import { trySendMsg2Runtime } from '@api/sw/common'
import { getOption } from '@api/sw/option'
import LocationWatcher from '@cs/location-watcher'
import DelayCoordinator from '../manager/delay-coordinator'
import LimitState from '../manager/state'
import { VisitProcessor } from '../processor'
import { TIMER_INTERVAL } from './common'
import { CountdownComponent } from './component'
import { CountdownModel } from './model'

export default class Countdown {
    #model = new CountdownModel()
    #component = new CountdownComponent()
    #interval?: ReturnType<typeof setInterval>
    #onVisibleChange = () => document.visibilityState === 'visible' && this.#sync()

    get isEffective() {
        return this.#model.enabled && !this.#model.limited && !this.location.isWhite
    }

    constructor(private readonly location: LocationWatcher, initialOption: tt4b.option.LimitOption) {
        location.onCurrChange(() => {
            this.#model.resetTime()
            this.#sync()
        })
        this.#model.enabled = initialOption.limitCountdown
        this.#model.delayDuration = initialOption.limitDelayDuration
    }

    async init(state: LimitState, visit: VisitProcessor, delayCoord: DelayCoordinator) {
        state.onChange(reason => {
            this.#model.limited = !!reason
            this.#sync()
        })

        visit.onChange(mills => {
            this.#model.visitTime = mills
            this.#render()
        })

        delayCoord.register(() => {
            this.#model.onDelay()
            this.#render()
        }, 'VISIT')

        document.addEventListener('visibilitychange', this.#onVisibleChange)

        this.isEffective && this.#sync()
    }

    destroy() {
        this.#stopTimer()
        this.#component.render(undefined)
        document.removeEventListener('visibilitychange', this.#onVisibleChange)
    }

    async fetchOption() {
        const option = await getOption()
        this.#model.delayDuration = option.limitDelayDuration
        this.#model.enabled = option.limitCountdown
        this.#sync()
    }

    async #sync() {
        this.#model.rules = this.isEffective
            ? await trySendMsg2Runtime('limit.list', { effective: true, url: this.location.url }) ?? []
            : []

        this.#render()
    }

    #startTimer() {
        if (this.#interval) return
        this.#interval = setInterval(() => {
            if (document.hidden || !this.isEffective) return
            this.#model.onActiveTick()
            this.#render()
        }, TIMER_INTERVAL)
    }

    #stopTimer() {
        if (!this.#interval) return
        clearInterval(this.#interval)
        this.#interval = undefined
    }

    async #render() {
        const data = this.#model.data
        this.#component.render(data)
        data ? this.#startTimer() : this.#stopTimer()
    }
}