import { onPermRemoved } from "@api/chrome/permission"
import db from "@db/option-database"
import { defaultOption } from '@util/constant/option'

type ChangeListener = (newVal: tt4b.option.DefaultOption, oldVal: tt4b.option.DefaultOption) => void

class OptionHolder {
    private value: tt4b.option.DefaultOption | undefined
    private listeners: ChangeListener[] = []

    constructor() {
        onPermRemoved(perm => {
            perm.permissions?.includes('tabGroups') && this.set({ countTabGroup: false })
        })
    }

    private async reset(): Promise<tt4b.option.DefaultOption> {
        const latest = Object.assign(defaultOption(), await db.getOption())
        this.value = latest
        return latest
    }

    async get(): Promise<tt4b.option.DefaultOption> {
        return this.value ?? await this.reset()
    }

    addChangeListener(listener: ChangeListener) {
        listener && this.listeners.push(listener)
    }

    async set(option: Partial<tt4b.option.AllOption>): Promise<void> {
        const exist = await this.get()
        const toSet = Object.assign(defaultOption(), exist, option)
        await db.setOption(toSet)
        this.value = toSet
        this.listeners.forEach(listener => listener(toSet, exist))
    }
}

export default new OptionHolder()