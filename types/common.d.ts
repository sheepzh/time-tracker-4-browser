// Embedded partial
declare type EmbeddedPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<EmbeddedPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<EmbeddedPartial<U>>
    : EmbeddedPartial<T[P]>
}

/**
 * Make one field optional
 */
type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] }

type MakeRequired<T, K extends keyof T = keyof T> = T extends any
    ? Omit<T, K> & Required<Pick<T, K extends keyof T ? K : never>>
    : never

type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>>

type RequiredPick<T, K extends keyof T> = Required<Pick<T, K>>

/**
 * Tuple with length
 *
 * @param E element
 * @param L length of tuple
 */
declare type Tuple<E, L extends number, Arr = [E, ...Array<E>]> =
    Pick<Arr, Exclude<keyof Arr, 'splice' | 'push' | 'pop' | 'shift' | 'unshift'>>
    & {
        readonly length: L
        [I: number]: E
    }

/**
 * Vector
 *
 * @param D dimension of vector
 */
declare type Vector<D extends number> = Tuple<number, D>

declare type CompareFn<T> = (a: T, b: T) => number

declare type Awaitable<T> = T | Promise<T>

declare type Getter<T> = () => T | Promise<T>

declare type NoArgCallback = () => void

declare type ArgCallback<T> = (val: T) => void

declare type Converter<T, R> = (val: T) => R