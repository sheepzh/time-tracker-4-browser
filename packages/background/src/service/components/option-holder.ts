import db from "@/background/database/option-database"
import { onPermRemoved } from "@api/chrome/permission"
import { defaultOption, type DefaultOption } from '@util/constant/option'

type ChangeListener = (option: DefaultOption) => void

class OptionHolder {
    private value: DefaultOption | undefined
    private listeners: ChangeListener[] = []

    constructor() {
        onPermRemoved(perm => {
            perm.permissions?.includes('tabGroups') && this.set({ countTabGroup: false })
        })
    }

    private async reset(): Promise<DefaultOption> {
        const latest = Object.assign(defaultOption(), await db.getOption())
        this.value = latest
        return latest
    }

    async get(): Promise<DefaultOption> {
        return this.value ?? await this.reset()
    }

    addChangeListener(listener: ChangeListener) {
        listener && this.listeners.push(listener)
    }

    async set(option: Partial<timer.option.AllOption>): Promise<void> {
        const exist = await this.get()
        const toSet = Object.assign(defaultOption(), exist, option)
        await db.setOption(toSet)
        this.value = toSet
        this.listeners.forEach(listener => listener(toSet))
    }
}

export default new OptionHolder()