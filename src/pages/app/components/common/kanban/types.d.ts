export type RingValue = [
    current?: number,
    last?: number,
]

export type ValueFormatter = (val: number | undefined) => string