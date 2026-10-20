import { createStringUnionGuard } from 'typescript-guard'

export const isAlive = ({ state }: tt4b.focus.Session) => state === 'running' || state === 'paused'

export function calcPhaseDuration(session: tt4b.focus.Session, now: number): number {
    const { state, end, phaseClock } = session
    if (!phaseClock) return 0 // Absent in legacy records
    const effectiveNow = state === 'running' ? now : end
    return Math.max(0, effectiveNow - phaseClock.start - phaseClock.pausedMs)
}

export const isMethod = createStringUnionGuard<tt4b.focus.Method>('focus', 'pomodoro')
export const isPolicy = createStringUnionGuard<tt4b.focus.FilterPolicy>('allow', 'block')