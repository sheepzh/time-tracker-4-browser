import alarmManager from '@bg/alarm-manager'
import db from "@db/focus-record-database"
import metaDatabase from '@db/meta-database'
import { isAlive } from '@util/focus'
import { MILL_PER_SECOND } from '@util/time'

async function stop(record: tt4b.focus.Session): Promise<void> {
    const now = Date.now()
    const { state, phase } = record
    if (state === 'running') {
        await increaseTime(record, now)
    } else if (state !== 'paused') {
        return
    }
    record.state = 'stopped'
    record.end = now
    record.logs.push({ action: 'stop', ts: now, phase })
    record.totalFocus = calcTotalFocus(record.logs)
    await db.save(record)
}

async function increaseTime(record: tt4b.focus.Session, now: number) {
    const checkpoint = [...record.logs]
        .sort((a, b) => b.ts - a.ts)
        .find(({ action }) => action === 'resume' || action === 'start')
    if (!checkpoint) {
        console.info("[WARNING] NO FOCUS CHECKPOINT FOUND")
        return
    }
    const thisDuration = now - checkpoint.ts
    record.currentDuration += thisDuration
}

function calcTotalFocus(logs: tt4b.focus.Session['logs']) {
    let total = 0
    let openTs: number | undefined = undefined
    for (const { action, ts, phase } of logs) {
        if (phase !== 'focus') {
            openTs = undefined
        } else if (action === 'start' || action === 'resume') {
            openTs = ts
        } else if (action === 'finish' || action === 'pause' || action === 'stop') {
            if (openTs === undefined) continue
            total += ts - openTs
            openTs = undefined
        }
    }
    return total
}

const ALARM_NAME = 'focus-session'
const calcAlarmWhen = (session: tt4b.focus.Session | undefined): number | null => {
    if (!session) return null
    const { state, duration, currentDuration, break: breakDur, phase } = session
    if (state !== 'running') return null
    let remaining: number
    if (phase === 'focus') {
        if (!duration) return null
        remaining = duration * MILL_PER_SECOND - currentDuration
    } else if (phase === 'break') {
        if (!breakDur) return null // Never happen
        remaining = breakDur * MILL_PER_SECOND - currentDuration
    } else {
        return null
    }
    return Date.now() + remaining
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
        const [latest, ...others] = records.sort((a, b) => b.end - a.end)
        for (const other of others) {
            await stop(other)
        }
        this.#session = latest

        if (this.#session && this.#session.state === 'running') {
            await increaseTime(this.#session, Date.now())
            await db.save(this.#session)
            await this.#startNewAlarm()
        }

        const meta = await metaDatabase.getMeta()
        this.#popup = meta.popup

        this.#initialized = true
    }

    async #handleAlarmTick(): Promise<void> {
        const session = this.#session
        if (!session || session.state !== 'running') return
        const now = Date.now()
        await increaseTime(session, now)

        const { method, phase, duration, break: breakDur, currentDuration } = session

        if (method === 'focus') {
            if (!duration) return // Never happen
            const remaining = duration * MILL_PER_SECOND - currentDuration
            if (remaining >= 0) return // Not yet time to switch phase cause of some reason
            session.state = 'done'
            session.end = now
            session.logs.push({ action: 'finish', ts: now, phase: 'focus' })
            session.totalFocus = calcTotalFocus(session.logs)
            await db.save(session)
            await alarmManager.remove(ALARM_NAME)
        } else if (method === 'pomodoro') {
            const realDuration = phase === 'focus' ? duration : breakDur
            if (realDuration && currentDuration < realDuration * MILL_PER_SECOND) {
                return
            }
            const prevPhase = phase
            const nextPhase: tt4b.focus.Phase = phase === 'focus' ? 'break' : 'focus'
            session.logs.push({ action: 'finish', ts: now, phase: prevPhase })
            session.phase = nextPhase
            session.currentDuration = 0
            session.logs.push({ action: 'start', ts: now, phase: nextPhase })
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
            totalFocus: 0,
            currentDuration: 0,
            phase: 'focus',
            state: 'running',
            logs: [{ action: 'start', ts: now, phase: 'focus' }],
        }
        await db.add(this.#session)

        await alarmManager.remove(ALARM_NAME)
        await this.#startNewAlarm()
    }

    async pause(): Promise<void> {
        if (!this.#session) return
        if (this.#session.state !== 'running') return

        const now = Date.now()
        await increaseTime(this.#session, now)
        this.#session.end = now
        this.#session.state = 'paused'
        this.#session.logs.push({ action: 'pause', ts: now, phase: this.#session.phase })
        await db.save(this.#session)

        await alarmManager.remove(ALARM_NAME)
    }

    async resume(): Promise<void> {
        if (!this.#session) return
        if (this.#session.state !== 'paused') return

        const now = Date.now()
        this.#session.state = 'running'
        this.#session.logs.push({ action: 'resume', ts: now, phase: this.#session.phase })
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
