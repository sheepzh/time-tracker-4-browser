import { createRecordGuard, isInt, isUnknown, type TypeGuard, } from 'typescript-guard'

export const isRecord = createRecordGuard<unknown>(isUnknown)

function createTupleGuard<T, const L extends number>(
    itemGuard: TypeGuard<T>,
    length: L,
): TypeGuard<Tuple<T, L>> {
    return (unk: unknown): unk is Tuple<T, L> => Array.isArray(unk) && unk.length === length && unk.every(itemGuard)
}

export const isVector2 = createTupleGuard(isInt, 2)