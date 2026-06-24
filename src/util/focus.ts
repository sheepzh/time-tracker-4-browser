import { createStringUnionGuard } from 'typescript-guard'

export const isAlive = ({ state }: tt4b.focus.Session) => state === 'running' || state === 'paused'

export const findLastStartTs = ({ logs, phase }: tt4b.focus.Session) => [...logs]
    .sort((a, b) => b.ts - a.ts)
    .find(({ action, phase: lp }) => lp === phase && (action === 'resume' || action === 'start'))?.ts

export const isMethod = createStringUnionGuard<tt4b.focus.Method>('focus', 'pomodoro')
export const isPolicy = createStringUnionGuard<tt4b.focus.FilterPolicy>('allow', 'block')