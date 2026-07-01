import { onPermRemoved } from "@api/chrome/permission"
import db from "@db/option-database"
import { defaultOption } from '@util/constant/option'

type ChangeListener = (newVal: tt4b.option.DefaultOption, oldVal: tt4b.option.DefaultOption) => void

class OptionHolder {
    #value: tt4b.option.DefaultOption | undefined
    #listeners: ChangeListener[] = []

    constructor() {
        onPermRemoved(perm => {
            perm.permissions?.includes('tabGroups') && this.set({ countTabGroup: false })
        })
    }

    async #reset(): Promise<tt4b.option.DefaultOption> {
        this.#value = await db.getOption()
        return this.#value
    }

    async get(): Promise<tt4b.option.DefaultOption> {
        return this.#value ?? await this.#reset()
    }

    addChangeListener(listener: ChangeListener) {
        listener && this.#listeners.push(listener)
    }

    async set(option: Partial<tt4b.option.AllOption>): Promise<void> {
        const exist = await this.get()
        const toSet = Object.assign(defaultOption(), exist, option)
        await db.setOption(toSet)
        this.#value = toSet
        this.#listeners.forEach(listener => listener(toSet, exist))
    }

    async sync(): Promise<void> {
        return db.sync()
    }

    async download(): Promise<void> {
        await db.download()
        await this.#reset()
    }
}

export default new OptionHolder()