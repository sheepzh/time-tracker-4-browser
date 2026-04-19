import { processDarkMode } from '@/pages/util/dark-mode'
import { getOption } from '@api/sw/option'
import { MILL_PER_MINUTE } from "@util/time"
import { exitFullscreen } from "../common"
import { createComponent } from "./component"

class Reminder {
    private id = 0
    private el: HTMLElement | undefined
    private darkMode: boolean = false

    public async show(data: timer.limit.ReminderInfo) {
        if (!document?.body || this.el) return

        await exitFullscreen()

        const el = createComponent(this.darkMode, data, () => this.close())
        const domId = `time-tracker-notification-${this.id++}`
        el.id = domId
        document.body.append(el)

        this.el = el
        const duration = data?.duration
        duration && setTimeout(() => this.close(), duration * MILL_PER_MINUTE)
    }

    private close() {
        if (!this.el) return
        this.el.remove()
        this.el = undefined
    }

    async init(): Promise<void> {
        const option = await getOption()
        this.darkMode = processDarkMode(option)
    }
}

export default Reminder