import { trySendMsg2Runtime } from '@api/sw/common'
import { getFocusPreset } from '@api/sw/focus'
import LocationWatcher from '@cs/location-watcher'
import { matches } from '@util/limit'
import type LimitState from '../manager/state'
import type { Processor } from '../types'

class FocusProcessor implements Processor {
    constructor(
        private readonly state: LimitState,
        private readonly location: LocationWatcher,
    ) { }

    async init(): Promise<void> {
        await this.reset()
    }

    async reset(): Promise<void> {
        // Ignore whitelist for focus
        const session = await trySendMsg2Runtime('focus.current')
        await this.#refresh(session)
    }

    onFocusChanged(session: tt4b.focus.Session | undefined): void {
        void this.#refresh(session)
    }

    async #refresh(session: tt4b.focus.Session | undefined) {
        this.state.removeByType('FOCUS')

        if (!session) return
        const { state, phase, cond, policy, presetId } = session
        if (state !== 'running' || phase !== 'focus') return

        const url = this.location.url
        const shouldBlock = policy === 'block' ? matches(cond, url) : !matches(cond, url)
        if (shouldBlock) {
            const presetName = presetId === undefined
                ? undefined
                : await getFocusPreset(presetId).then(p => p?.name)
            this.state.add({ type: 'FOCUS', ...session, presetName })
        }
    }
}

export default FocusProcessor