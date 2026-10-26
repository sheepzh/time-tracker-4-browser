/**
 * Regression tests for the alarm re-scheduling hot loop (DST fall-back day).
 *
 * The real alarm-manager runs against a faithful in-memory `chrome.alarms` mock:
 * an alarm whose `when` is not in the future fires immediately, like the real API.
 *
 * The first block is timezone independent and always runs.
 * The second block reproduces the real-world case (23:00 local on a DST fall-back
 * day) and needs a timezone where 2026-10-25 is that day, e.g.
 *   TZ=Europe/Vienna npm test
 * It is skipped in other timezones.
 */
import { rstest } from '@rstest/core'
import { MILL_PER_MINUTE, MILL_PER_SECOND } from '@util/time'

const IS_FALL_BACK_TZ = new Date(2026, 9, 24, 12).getTimezoneOffset() === -120
    && new Date(2026, 9, 25, 12).getTimezoneOffset() === -60

const MAX_FIRES = 5000

type Listener = (alarm: { name: string, scheduledTime: number }) => unknown

function installAlarmMock() {
    const alarms = new Map<string, { when: number, timer: ReturnType<typeof setTimeout> }>()
    const listeners: Listener[] = []
    const stats = { created: 0, fired: 0, runaway: false }

    const api = {
        onAlarm: { addListener: (l: Listener) => void listeners.push(l) },
        create: async (name: string, info: { when: number }) => {
            stats.created++
            if (stats.fired >= MAX_FIRES) {
                stats.runaway = true
                return
            }
            await api.clear(name)
            const delay = Math.max(0, info.when - Date.now())
            const timer = setTimeout(() => {
                alarms.delete(name)
                stats.fired++
                listeners.forEach(l => l({ name, scheduledTime: info.when }))
            }, delay)
            alarms.set(name, { when: info.when, timer })
        },
        clear: async (name: string) => {
            const existing = alarms.get(name)
            if (!existing) return false
            clearTimeout(existing.timer)
            alarms.delete(name)
            return true
        },
        get: async (name: string) => {
            const a = alarms.get(name)
            return a ? { name, scheduledTime: a.when } : undefined
        },
    }
    Object.assign(chrome, { alarms: api })
    return stats
}

type SimResult = { handlerCalls: number, created: number, runaway: boolean, callTimes: string[] }

async function simulate(startAt: Date, minutes: number, when: () => number): Promise<SimResult> {
    rstest.useFakeTimers({})
    rstest.setSystemTime(startAt)
    const stats = installAlarmMock()

    rstest.resetModules()
    const { default: alarmManager } = await import('@bg/alarm-manager')

    let handlerCalls = 0
    const callTimes: string[] = []
    await alarmManager.setWhen('daily-test', when, async () => {
        handlerCalls++
        if (callTimes.length < 5) callTimes.push(new Date().toLocaleTimeString('en-GB'))
    })

    for (let i = 0; i < minutes; i++) {
        await rstest.advanceTimersByTimeAsync(MILL_PER_MINUTE)
    }

    rstest.useRealTimers()
    return { handlerCalls, created: stats.created, runaway: stats.runaway, callTimes }
}

describe('alarm-manager re-scheduling guard', () => {
    test('a when() that keeps returning a past timestamp must not hot-loop', async () => {
        const when = () => Date.now() - MILL_PER_SECOND
        const { handlerCalls, runaway } = await simulate(new Date(2026, 0, 10, 12), 1, when)
        expect(runaway).toBe(false)
        // at most once per second (MIN_RESCHEDULE_DELAY), initial fire included
        expect(handlerCalls).toBeLessThan(62)
        expect(handlerCalls).toBeGreaterThan(0)
    })
})

describe('alarm-manager on DST fall-back day (23:00 local)', () => {
    const run = IS_FALL_BACK_TZ ? test : test.skip
    // 22:59:30 local on 2026-10-25, simulate 62 minutes (crosses 23:00 and 00:00)
    const startAt = new Date(2026, 9, 25, 22, 59, 30)

    // what getStartOfNextDay() does
    const calendarNextMidnight = () => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        d.setDate(d.getDate() + 1)
        return d.getTime()
    }

    run('calendar midnight fires exactly once, at 00:00', async () => {
        const { handlerCalls, created, runaway, callTimes } = await simulate(startAt, 62, calendarNextMidnight)
        expect(runaway).toBe(false)
        expect(handlerCalls).toBe(1)
        expect(callTimes[0]).toBe('00:00:00')
        // initial create + one re-schedule after firing
        expect(created).toBe(2)
    })
})
