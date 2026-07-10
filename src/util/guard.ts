import { isInt, TypeGuard } from 'typescript-guard'

export const isRecord = (unk: unknown): unk is Record<string, unknown> => typeof unk === 'object' && unk !== null && !Array.isArray(unk)

export function createTupleGuard<T, const L extends number>(
    itemGuard: TypeGuard<T>,
    length: L,
): TypeGuard<Tuple<T, L>> {
    return (unk: unknown): unk is Tuple<T, L> => Array.isArray(unk) && unk.length === length && unk.every(itemGuard)
}

export const isVector2 = createTupleGuard(isInt, 2)