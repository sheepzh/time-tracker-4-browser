import { trySendMsg2Runtime } from '@api/sw/common'
import { matches } from '@util/limit'
import type { ModalContext, Processor } from '../types'

class FocusProcessor implements Processor {
    constructor(private context: ModalContext) { }

    async init(): Promise<void> {
        const session = await trySendMsg2Runtime('focus.current')
        this.#updateBlock(session)
    }

    onLimitChanged(): void {
        // Focus is not affected by limit change
    }

    onFocusChanged(session: tt4b.focus.Session | undefined): void {
        this.#updateBlock(session)
    }

    #updateBlock(session: tt4b.focus.Session | undefined) {
        this.context.modal.removeReasonsByType('FOCUS')

        if (!session) return
        const { state, phase, cond, mode, template } = session
        if (state !== 'running' || phase !== 'focus') return

        const url = this.context.url
        const shouldBlock = mode === 'block' ? matches(cond, url) : !matches(cond, url)
        shouldBlock && this.context.modal.addReason({ type: 'FOCUS', cond, mode, template })
    }
}

export default FocusProcessor