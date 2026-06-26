import { createStringUnionGuard } from 'typescript-guard'

export const isAlive = ({ state }: tt4b.focus.Session) => state === 'running' || state === 'paused'

export const findLastStartTs = ({ logs, phase }: tt4b.focus.Session): number | undefined => {
    for (let i = logs.length - 1; i >= 0; i--) {
        const e = logs[i]
        if (!e) continue // never happens, just for type check
        const { action, ts, phase: p } = e
        if (p !== phase) continue
        if (action === 'start' || action === 'resume') return ts
    }
    return undefined
}

export const isMethod = createStringUnionGuard<tt4b.focus.Method>('focus', 'pomodoro')
export const isPolicy = createStringUnionGuard<tt4b.focus.FilterPolicy>('allow', 'block')