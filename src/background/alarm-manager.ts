import { clearAlarm, createAlarm, getAlarm, onAlarm } from "@api/chrome/alarm"
import { getRuntimeId } from "@api/chrome/runtime"
import { MILL_PER_SECOND } from "@util/time"

type _AlarmConfig = {
    handler: _Handler,
    interval?: number,
    when?: () => number | null,
}

type _Handler = (alarm: ChromeAlarm) => Awaitable<void>

const ALARM_PREFIX = 'timer-alarm-' + getRuntimeId() + '-'
const ALARM_PREFIX_LENGTH = ALARM_PREFIX.length

const getInnerName = (outerName: string) => ALARM_PREFIX + outerName
const getOuterName = (innerName: string) => innerName.substring(ALARM_PREFIX_LENGTH)

/**
 * Minimum delay before an alarm is re-scheduled after it fired.
 *
 * Guards against hot loops: if `when()` returns a timestamp that is not in the future
 * (e.g. because of a DST transition or a clock change), `chrome.alarms.create()` would
 * fire the alarm immediately, which re-schedules it again, and so on.
 */
const MIN_RESCHEDULE_DELAY = MILL_PER_SECOND

const calcNextTs = (config: _AlarmConfig): number | null => {
    const { interval, when } = config
    if (interval) return Date.now() + interval
    if (when) {
        const next = when()
        return next === null ? null : Math.max(next, Date.now() + MIN_RESCHEDULE_DELAY)
    }
    return Date.now() + MIN_RESCHEDULE_DELAY
}

/**
 * The manager of alarms
 *
 * @since 1.4.6
 */
class AlarmManager {
    private alarms: Record<string, _AlarmConfig> = {}

    constructor() {
        this.init()
    }

    private init() {
        onAlarm(async alarm => {
            const name = alarm.name
            if (!name.startsWith(ALARM_PREFIX)) {
                // Unknown alarm
                return
            }
            const innerName = getOuterName(name)
            const config = this.alarms[innerName]
            if (!config) {
                await clearAlarm(name)
                return
            }
            // Handle alarm event
            try {
                await config.handler(alarm)
            } catch (e) {
                console.info("Failed to handle alarm event", e)
            } finally {
                // Clear this one
                await clearAlarm(name)
                const nextTs = calcNextTs(config)
                nextTs && await createAlarm(name, nextTs)
            }
        })
    }

    /**
     * Set a alarm to do sth with interval
     *
     * @param interval mills
     */
    async setInterval(outerName: string, interval: number, handler: _Handler): Promise<void> {
        if (!interval || !handler) {
            return
        }
        const config: _AlarmConfig = { handler, interval }
        if (this.alarms[outerName]) {
            // Existed, only update the config
            this.alarms[outerName] = config
            return
        }
        // Initialize config
        this.alarms[outerName] = config
        // Create new one alarm
        await createAlarm(getInnerName(outerName), Date.now() + interval)
    }

    /**
     * Set a alarm to do sth if the time arrives
     */
    async setWhen(outerName: string, when: () => number | null, handler: _Handler): Promise<void> {
        if (!when || !handler) {
            return
        }
        const config: _AlarmConfig = { handler, when }
        if (this.alarms[outerName]) {
            // Existed, only update the config
            this.alarms[outerName] = config
            return
        }
        // Initialize config
        this.alarms[outerName] = config
        // Create new one alarm
        const next = calcNextTs(config)
        next && await createAlarm(getInnerName(outerName), next)
    }

    /**
     * Remove a interval
     */
    async remove(outerName: string): Promise<void> {
        delete this.alarms[outerName]
        await clearAlarm(getInnerName(outerName))
    }

    /**
     * Judge if exist
     */
    async getAlarm(outerName: string): Promise<chrome.alarms.Alarm | undefined> {
        const innerName = getInnerName(outerName)
        const existed = await getAlarm(innerName)
        if (!existed && this.alarms[outerName]) {
            delete this.alarms[outerName]
        }
        return existed
    }
}

export default new AlarmManager()