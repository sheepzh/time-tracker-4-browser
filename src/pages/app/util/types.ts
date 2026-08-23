import { createArrayGuard, createOptionalGuard, createStringUnionGuard, isInt } from 'typescript-guard'

export const isTimeFormat = createStringUnionGuard<tt4b.ui.TimeFormat>('default', 'hour', 'minute', 'second')

export const isOptionalIntArray = createOptionalGuard(createArrayGuard(isInt))
