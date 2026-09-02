import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import DelayCoordinator from '../manager/delay-coordinator'
import LimitState from '../manager/state'
import { VisitProcessor } from '../processor'
import { CountdownComponent } from './component'
import { CountdownState } from './state'

const TIMER_INTERVAL = 1000

export default class Countdown {
    #enabled: boolean = false
    #visible: boolean = false
    #interval?: ReturnType<typeof setInterval>
    readonly #state = new CountdownState()
    readonly #component = new CountdownComponent()
    readonly #onVisibleChange = () => document.visibilityState === 'visible' && this.#sync()

    get isEffective() {
        return this.#enabled && !this.#visible && !this.location.isWhite
    }

    constructor(private readonly location: LocationWatcher, initialOption: tt4b.option.LimitOption) {
        this.applyOption(initialOption)
    }

    async init(state: LimitState, visit: VisitProcessor, delayCoord: DelayCoordinator) {
        this.location.onCurrChange(() => {
            this.#state.resetTime()
            this.#sync()
        })

        state.onChange(reason => {
            this.#visible = !!reason
            this.#sync()
        })

        visit.onChange(mills => {
            this.#state.visitTime = mills
            this.#render()
        })

        delayCoord.register(() => {
            this.#state.incDelayCount()
            this.#render()
        }, 'VISIT')

        document.addEventListener('visibilitychange', this.#onVisibleChange)

        this.#sync()
    }

    destroy() {
        this.#stopTimer()
        this.#component.render(undefined)
        document.removeEventListener('visibilitychange', this.#onVisibleChange)
    }

    applyOption(option: tt4b.option.LimitOption) {
        this.#state.delayDuration = option.limitDelayDuration
        this.#enabled = option.limitCountdown
        this.#sync()
    }

    async #sync() {
        this.#state.rules = this.isEffective
            ? await trySendMsg2Runtime('limit.list', { effective: true, url: this.location.url }) ?? []
            : []

        this.#render()
    }

    #startTimer() {
        if (this.#interval) return
        this.#interval = setInterval(() => {
            if (document.hidden || !this.isEffective) return
            this.#state.addActiveTime(TIMER_INTERVAL)
            this.#render()
        }, TIMER_INTERVAL)
    }

    #stopTimer() {
        if (!this.#interval) return
        clearInterval(this.#interval)
        this.#interval = undefined
    }

    #render() {
        const data = this.#state.data
        this.#component.render(data)
        data ? this.#startTimer() : this.#stopTimer()
    }
}
