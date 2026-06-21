import { trySendMsg2Runtime } from '@api/sw/common'
import { getFocusPreset } from '@api/sw/focus'
import LocationWatcher from '@cs/location-watcher'
import { matches } from '@util/limit'
import type { MaskModal, Processor } from '../types'

class FocusProcessor implements Processor {
    constructor(
        private readonly modal: MaskModal,
        private readonly location: LocationWatcher,
    ) { }

    async init(): Promise<void> {
        await this.reset()
    }

    async reset(): Promise<void> {
        // Ignore whitelist for focus
        const session = await trySendMsg2Runtime('focus.current')
        this.#refresh(session)
    }

    onFocusChanged(session: tt4b.focus.Session | undefined): void {
        this.#refresh(session)
    }

    async #refresh(session: tt4b.focus.Session | undefined) {
        this.modal.removeReasonsByType('FOCUS')

        if (!session) return
        const { state, phase, cond, policy, presetId } = session
        if (state !== 'running' || phase !== 'focus') return

        const url = this.location.url
        const shouldBlock = policy === 'block' ? matches(cond, url) : !matches(cond, url)
        if (shouldBlock) {
            const presetName = presetId === undefined
                ? undefined
                : await getFocusPreset(presetId).then(p => p?.name)
            this.modal.addReason({ type: 'FOCUS', ...session, presetName })
        }
    }
}

export default FocusProcessor