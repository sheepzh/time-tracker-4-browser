import alarmManager from '@bg/alarm-manager'
import db from "@db/focus-record-database"
import metaDatabase from '@db/meta-database'
import { calcPhaseDuration, isAlive } from '@util/focus'
import { MILL_PER_SECOND } from '@util/time'

async function stop(record: tt4b.focus.Session): Promise<void> {
    const now = Date.now()
    const { state } = record
    if (state !== 'running' && state !== 'paused') return
    record.state = 'stopped'
    record.end = now
    await db.save(record)
}

/**
 * Advance the session's phase clock to where it should be at `now`, even across multiple phases.
 *
 * @returns false when nothing is advanced (legacy record, zero-length phase or not expired yet).
 */
function advancePhase(session: tt4b.focus.Session, now: number): boolean {
    // Undefined duration/break (no limit) becomes 0 and never advances
    const { phase, phaseClock, duration = 0, break: breakSec = 0 } = session
    if (!phaseClock) return false // Absent in legacy records
    const isFocus = phase === 'focus'
    const phaseMs = (isFocus ? duration : breakSec) * MILL_PER_SECOND
    const nextMs = (isFocus ? breakSec : duration) * MILL_PER_SECOND
    const nextPhase = isFocus ? 'break' : 'focus'
    if (!phaseMs) return false
    const boundary = phaseClock.start + phaseMs + phaseClock.pausedMs
    if (now < boundary) return false
    // Freeze at the zero-length next phase
    if (!nextMs) return resetPhase(session, nextPhase, boundary)
    const period = phaseMs + nextMs
    const overflow = now - boundary
    const cycles = Math.floor(overflow / period)
    const remainder = overflow - cycles * period
    const base = boundary + cycles * period
    if (remainder < nextMs) return resetPhase(session, nextPhase, base)
    return resetPhase(session, phase, base + nextMs)
}

const resetPhase = (session: tt4b.focus.Session, next: tt4b.focus.Phase, start: number): true => {
    session.phase = next
    session.phaseClock = { start, pausedMs: 0 }
    return true
}

/**
 * Derive the phase clock from the legacy logs of a running/paused record.
 */
function derivePhaseClock(session: tt4b.focus.Session): tt4b.focus.PhaseClock | undefined {
    const { logs, phase } = session
    if (!logs) return undefined
    let start: number | undefined, resumeTs: number | undefined, pausedMs = 0
    for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i]
        if (log?.phase !== phase) break
        const { action, ts } = log
        if (action === 'start') {
            start = ts
            break
        }
        if (action === 'resume') {
            resumeTs = ts
        } else if (resumeTs !== undefined) {
            pausedMs += resumeTs - ts
            resumeTs = undefined
        }
    }
    if (start === undefined) return undefined
    return { start, pausedMs }
}

const ALARM_NAME = 'focus-session'
const calcAlarmWhen = (session: tt4b.focus.Session | undefined): number | null => {
    if (!session) return null
    const { state, duration, break: breakDur, phase } = session
    if (state !== 'running') return null
    const now = Date.now()
    const currentDuration = calcPhaseDuration(session, now)
    let remaining: number
    if (phase === 'focus') {
        if (!duration) return null
        remaining = duration * MILL_PER_SECOND - currentDuration
    } else if (phase === 'break') {
        if (!breakDur) return null
        remaining = breakDur * MILL_PER_SECOND - currentDuration
    } else {
        return null
    }
    return now + remaining
}

type OnTick = (session: tt4b.focus.Session) => Promise<void>

class FocusHolder {
    #session: tt4b.focus.Session | undefined = undefined
    #popup: tt4b.ui.PopupMenu | undefined = undefined
    #initialized: boolean = false
    #onTick: OnTick | undefined = undefined

    constructor() {
        void this.#init()
    }

    async #init() {
        const records = await db.list({ state: ['running', 'paused'] })
        const [latest, ...others] = records.toSorted((a, b) => b.end - a.end)
        for (const other of others) {
            await stop(other)
        }
        // The stale others are stopped and never read again, so they stay in the legacy shape
        if (latest && !latest.phaseClock) {
            const clock = derivePhaseClock(latest)
            if (clock) {
                latest.phaseClock = clock
                await db.save(latest)
            } else {
                // A session without a clock can never advance
                await stop(latest)
            }
        }
        this.#session = latest

        const meta = await metaDatabase.getMeta()
        this.#popup = meta.popup

        if (this.#session?.state === 'running') {
            await this.#handleAlarmTick()
            await this.#startNewAlarm()
        }

        this.#initialized = true
    }

    async #handleAlarmTick(): Promise<void> {
        const session = this.#session
        if (session?.state !== 'running') return
        const now = Date.now()

        const { method, duration } = session

        if (method === 'focus') {
            if (!duration) return // Never happen
            const remaining = duration * MILL_PER_SECOND - calcPhaseDuration(session, now)
            if (remaining >= 0) return // Not yet time to switch phase cause of some reason
            session.state = 'done'
            session.end = now
            await db.save(session)
            await alarmManager.remove(ALARM_NAME)
        } else if (method === 'pomodoro') {
            if (!advancePhase(session, now)) return
            await db.save(session)
        }

        await this.#onTick?.(session)
    }

    async #startNewAlarm() {
        await alarmManager.setWhen(
            ALARM_NAME,
            () => this.#session ? calcAlarmWhen(this.#session) : null,
            () => this.#handleAlarmTick(),
        )
    }

    async start(config: tt4b.focus.Config, presetId?: number): Promise<void> {
        if (!this.#initialized) throw new Error("Not initialized yet")
        if (this.#session) {
            const { state } = this.#session
            if (state === 'running' || state === 'paused') return
        }

        const now = Date.now()
        this.#session = {
            ...config,
            presetId,
            start: now,
            end: now,
            phase: 'focus',
            state: 'running',
            phaseClock: { start: now, pausedMs: 0 },
        }
        await db.add(this.#session)

        await alarmManager.remove(ALARM_NAME)
        await this.#startNewAlarm()
    }

    async pause(): Promise<void> {
        if (!this.#session) return
        if (this.#session.state !== 'running') return

        const now = Date.now()
        this.#session.end = now
        this.#session.state = 'paused'
        await db.save(this.#session)

        await alarmManager.remove(ALARM_NAME)
    }

    async resume(): Promise<void> {
        if (!this.#session) return
        const { state, phaseClock } = this.#session
        if (state !== 'paused' || !phaseClock) return

        const now = Date.now()
        this.#session.state = 'running'
        phaseClock.pausedMs += now - this.#session.end
        await db.save(this.#session)

        await this.#startNewAlarm()
    }

    async stop(): Promise<void> {
        if (!this.#session) return
        await stop(this.#session)

        await alarmManager.remove(ALARM_NAME)
    }

    async delay(): Promise<void> {
        if (!this.#session) return
        if (this.#session.method !== 'focus') return
        if (!this.#session.duration) return
        this.#session.duration += 60 * 5 // Add 5 minutes
        await db.save(this.#session)
    }

    async dismiss(): Promise<void> {
        if (this.#session && isAlive(this.#session)) return
        this.#session = undefined
    }

    set onTick(handler: OnTick | undefined) {
        this.#onTick = handler
    }

    get current(): tt4b.focus.Session | undefined {
        return this.#session
    }

    get badge(): string | null {
        const session = this.current
        if (this.#popup !== 'focus') return null
        if (!session) return null
        const { state, phase } = session
        if (state === 'running') return phase === 'focus' ? '🎯' : '😌'
        if (state === 'paused') return '⏸️'
        return null
    }

    get popup(): tt4b.ui.PopupMenu | undefined {
        return this.#popup
    }

    set popup(val: tt4b.ui.PopupMenu | undefined) {
        this.#popup = val
        void metaDatabase.getMeta()
            .then(meta => metaDatabase.update({ ...meta, popup: val }))
    }
}

const focusHolder = new FocusHolder()

export default focusHolder
