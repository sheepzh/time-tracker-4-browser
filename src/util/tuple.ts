
export function isTuple<T, N extends number>(arr: T[], len: N): arr is Tuple<T, N> {
    return arr.length === len
}

/**
 * Add tuple
 */
export const addVector = <L extends number>(a: Vector<L>, toAdd: Vector<L> | number): Vector<L> => {
    const arr = a as number[]

    if (typeof toAdd === 'number') {
        return arr.map(v => v + toAdd) as Vector<L>
    } else {
        const b = toAdd as number[]
        return arr.map((v, i) => v + (b[i] ?? 0)) as Vector<L>
    }
}

/**
 * Subtract tuple
 */
export const subVector = <L extends number>(a: Vector<L>, toSub: Vector<L> | number): Vector<L> => {
    const arr = a as number[]

    if (typeof toSub === 'number') {
        return arr.map(v => v - toSub) as Vector<L>
    } else {
        const b = toSub as number[]
        return arr.map((v, i) => v - (b[i] ?? 0)) as Vector<L>
    }
}

/**
 * Multiple tuple
 */
export const multiTuple = <L extends number>(a: Vector<L>, multiFactor: number): Vector<L> => {
    const arr = a as number[]
    return arr.map(v => v * multiFactor) as Vector<L>
}
