import { range } from "./array"

const isTuple = (arg: unknown): arg is Tuple<any, never> => {
    if (Array.isArray(arg)) return true
    if (!(arg as Object).hasOwnProperty?.("get")) return false
    const predicate = arg as Tuple<any, never>
    const len = predicate?.length
    return typeof len === 'number' && !isNaN(len) && isFinite(len) && len >= 0 && Number.isInteger(len)
}

/**
 * Add tuple
 */
export const addVector = <L extends number>(a: Vector<L>, toAdd: Vector<L> | number): Vector<L> => {
    const l: L = a.length ?? 0 as L
    if (isTuple(toAdd)) {
        return range(l).map(idx => (a?.[idx] ?? 0) + (toAdd?.[idx] ?? 0)) as unknown as Vector<L>
    } else {
        return a?.map(v => (v ?? 0) + ((toAdd as number) ?? 0)) as unknown as Vector<L>
    }
}

/**
 * Subtract tuple
 */
export const subVector = <L extends number>(a: Vector<L>, toSub: Vector<L> | number): Vector<L> => {
    const l: L = a.length ?? 0 as L
    if (isTuple(toSub)) {
        return range(l).map(idx => (a?.[idx] ?? 0) - (toSub?.[idx] ?? 0)) as unknown as Vector<L>
    } else {
        return a?.map(v => (v ?? 0) + ((toSub as number) ?? 0)) as unknown as Vector<L>
    }
}

/**
 * Multiple tuple
 */
export const multiTuple = <L extends number>(a: Vector<L>, multiFactor: number): Vector<L> => {
    return a?.map(v => (v ?? 0) * (multiFactor ?? 0)) as unknown as Vector<L>
}

/**
 * Divide tuple
 */
export const divideTuple = <L extends number>(a: Vector<L>, divideFactor: number): Vector<L> => {
    return a?.map(v => (v ?? 0) / (divideFactor ?? 0)) as unknown as Vector<L>
}
