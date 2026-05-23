import { isInt } from 'typescript-guard'

export const isRecord = (unk: unknown): unk is Record<string, unknown> => typeof unk === 'object' && unk !== null

export const isVector2 = (unk: unknown): unk is Vector<2> => Array.isArray(unk) && unk.length === 2 && unk.every(isInt)