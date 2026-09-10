import { trySendMsg2Runtime } from '@api/sw/common'
import type Dispatcher from './dispatcher'

class Audible {
    #on = false
    #listeners: ArgCallback<boolean>[] = []

    get on() { return this.#on }

    onChange = (listener: ArgCallback<boolean>) => this.#listeners.push(listener)

    async init(dispatcher: Dispatcher) {
        this.#on = !!await trySendMsg2Runtime('cs.getAudible')
        dispatcher.register('syncAudible', val => {
            const changed = val !== this.#on
            this.#on = val
            changed && this.#listeners.forEach(l => l(val))
        })
    }
}

const audible = new Audible()
export default audible