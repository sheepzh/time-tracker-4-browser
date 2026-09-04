import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import LimitState from '../manager/state'
import type { SharedOption, VisitData } from '../types'
import { CountdownComponent } from './component'
import { CountdownState } from './state'

export default class Countdown {
    #modalVisible: boolean = false
    #syncSeq: number = 0
    readonly #state: CountdownState
    readonly #component = new CountdownComponent()

    get #isEffective() {
        return this.option.countdown && !this.#modalVisible && !this.location.isWhite
    }

    constructor(
        private readonly location: LocationWatcher,
        private readonly option: Readonly<SharedOption>,
        private readonly visit: VisitData,
    ) {
        this.#state = new CountdownState(option, visit)
    }

    init(state: LimitState) {
        this.location.onCurrChange(() => void this.sync())

        state.onChange(reason => {
            this.#modalVisible = !!reason
            this.sync()
        })

        this.visit.onChange(() => {
            this.#state.syncActiveTime()
            this.#render()
        })

        document.addEventListener('visibilitychange', () => !document.hidden && void this.sync())

        void this.sync()
    }

    async sync() {
        const seq = ++this.#syncSeq
        const rules = this.#isEffective
            ? await trySendMsg2Runtime('limit.list', { effective: true, url: this.location.url }) ?? []
            : []
        // Discard the outdated response
        if (seq !== this.#syncSeq) return

        this.#state.rules = rules
        this.#render()
    }

    #render() {
        this.#component.render(this.#state.data)
    }
}
