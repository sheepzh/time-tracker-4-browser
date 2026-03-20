import { getOption } from '@/api/sw/option'
import { processDarkMode } from '@/util/dark-mode'
import { MILL_PER_MINUTE } from "@util/time"
import { exitFullscreen, } from "../common"
import type { Processor } from '../types'
import { createComponent } from "./component"

class Reminder implements Processor {
    private id = 0
    private el: HTMLElement | undefined
    private darkMode: boolean = false

    handleMsg(code: timer.tab.ReqCode, data: unknown): Awaitable<timer.tab.Response<timer.tab.ReqCode>> {
        if (code !== 'limitReminder') {
            return { code: 'ignore' }
        }
        this.show(data as timer.limit.ReminderInfo)
        return { code: 'success' }
    }

    private async show(data: timer.limit.ReminderInfo) {
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
        getOption().then(processDarkMode)
    }
}

export default Reminder