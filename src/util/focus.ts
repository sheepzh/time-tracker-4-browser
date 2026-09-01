import { createStringUnionGuard } from 'typescript-guard'

export const isAlive = ({ state }: tt4b.focus.Session) => state === 'running' || state === 'paused'

export function calcPhaseDuration(session: tt4b.focus.Session, now: number): number {
    const { logs, phase, state } = session
    let duration = 0
    let closeTs: number | undefined, openStartTs: number | undefined
    for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i]
        if (log?.phase !== phase) break
        const { action, ts } = log
        if (action === 'pause' || action === 'finish' || action === 'stop') {
            closeTs = ts
        } else if (action === 'start' || action === 'resume') {
            if (closeTs === undefined) {
                openStartTs = ts
            } else {
                duration += closeTs - ts
                closeTs = undefined
            }
        }
    }
    if (state === 'running' && openStartTs !== undefined) {
        duration += now - openStartTs
    }
    return duration
}

export const isMethod = createStringUnionGuard<tt4b.focus.Method>('focus', 'pomodoro')
export const isPolicy = createStringUnionGuard<tt4b.focus.FilterPolicy>('allow', 'block')