import { clearAlarm, createAlarm, getAlarm, onAlarm } from "@api/chrome/alarm"
import { getRuntimeId } from "@api/chrome/runtime"

type _AlarmConfig = {
    handler: _Handler,
    interval?: number,
    when?: () => number | null,
}

type _Handler = (alarm: ChromeAlarm) => void

const ALARM_PREFIX = 'timer-alarm-' + getRuntimeId() + '-'
const ALARM_PREFIX_LENGTH = ALARM_PREFIX.length

const getInnerName = (outerName: string) => ALARM_PREFIX + outerName
const getOuterName = (innerName: string) => innerName.substring(ALARM_PREFIX_LENGTH)

const calcNextTs = (config: _AlarmConfig): number | null => {
    const { interval, when } = config
    if (interval) return Date.now() + interval
    if (when) return when()
    return Date.now()
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
            const config: _AlarmConfig = this.alarms[innerName]
            if (!config) {
                // Not registered, or removed
                return
            }
            // Handle alarm event
            try {
                config.handler?.(alarm)
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