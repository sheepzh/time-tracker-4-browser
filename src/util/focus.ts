import { createStringUnionGuard } from 'typescript-guard'

export const isAlive = ({ state }: tt4b.focus.Session) => state === 'running' || state === 'paused'

export const isMethod = createStringUnionGuard<tt4b.focus.Method>('focus', 'pomodoro')
export const isPolicy = createStringUnionGuard<tt4b.focus.FilterPolicy>('allow', 'block')