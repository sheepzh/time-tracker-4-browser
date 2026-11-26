import { MILL_PER_HOUR, pad } from '@util/time'
import { createNumberUnionGuard } from 'typescript-guard'

export const isWeekStart = createNumberUnionGuard<tt4b.WeekStart>(1, 2, 3, 4, 5, 6, 7)

export default class StatDay {
    private constructor(readonly y: number, readonly m: number, readonly d: number) { }

    static ofLabel(label: Date): StatDay {
        return new StatDay(label.getFullYear(), label.getMonth() + 1, label.getDate())
    }

    static ofPeriod(key: tt4b.period.Key): StatDay {
        return new StatDay(key.year, key.month, key.date)
    }

    static of(instant: Date, offset: number): StatDay {
        const ts = instant.getTime()
        const shifted = new Date(
            instant.getFullYear(), instant.getMonth(), instant.getDate(),
            instant.getHours(), instant.getMinutes() - offset,
        )
        const guess = StatDay.ofLabel(shifted)
        if (guess.startTime(offset) > ts) return guess.prev()
        if (guess.next().startTime(offset) <= ts) return guess.next()
        return guess
    }

    static today(offset: number): StatDay {
        return StatDay.of(new Date(), offset)
    }

    static parse(label: string | undefined): StatDay | undefined {
        if (!label || !/^\d{8}$/.test(label)) return undefined
        return new StatDay(
            Number(label.substring(0, 4)),
            Number(label.substring(4, 6)),
            Number(label.substring(6, 8)),
        )
    }

    startTime(offset: number): number {
        return new Date(this.y, this.m - 1, this.d, 0, offset).getTime()
    }

    prev(): StatDay {
        return this.addDays(-1)
    }

    next(): StatDay {
        return this.addDays(1)
    }

    addDays(day: number): StatDay {
        return StatDay.ofLabel(new Date(this.y, this.m - 1, this.d + day))
    }

    monthStart(): StatDay {
        return StatDay.ofLabel(new Date(this.y, this.m - 1, 1))
    }

    monthEnd(): StatDay {
        return StatDay.ofLabel(new Date(this.y, this.m, 0))
    }

    weekStart(weekStart: tt4b.WeekStart): StatDay {
        return this.addDays(-((this.weekday() - weekStart + 7) % 7))
    }

    weekday(): tt4b.WeekStart {
        // 0 means Sunday when using getDay()
        return (this.toLabel().getDay() || 7) as tt4b.WeekStart
    }

    toLabel(): Date {
        return new Date(this.y, this.m - 1, this.d)
    }

    toDate(): Temporal.PlainDate {
        return new Temporal.PlainDate(this.y, this.m, this.d)
    }

    toString(): string {
        return `${pad(this.y, 4)}${pad(this.m)}${pad(this.d)}`
    }

    equals(other: StatDay): boolean {
        return this.y === other.y && this.m === other.m && this.d === other.d
    }

    valueOf(): number {
        return Date.UTC(this.y, this.m - 1, this.d)
    }

    /**
     * @returns days count inclusive this and the end
     */
    daysTo(end: StatDay): number {
        const delta = end.valueOf() - this.valueOf()
        return delta < 0 ? 0 : delta / MILL_PER_HOUR / 24 + 1
    }

    rangeTo(end: StatDay | number): StatRange {
        if (typeof end === "number") return end > 0 ? [this, this.addDays(end)] : [this.addDays(end), this]
        return this > end ? [end, this] : [this, end]
    }
}

export type StatRange = [StatDay, StatDay]

export function statRangeStr(range: StatRange | undefined): [string, string] | undefined {
    if (!range) return undefined
    return [range[0].toString(), range[1].toString()]
}

export const splitStatDays = (start: number, end: number, offset: number): Map<StatDay, number> => {
    const res = new Map<StatDay, number>()
    while (start < end) {
        const day = StatDay.of(new Date(start), offset)
        const newStart = Math.min(end, day.next().startTime(offset))
        if (newStart <= start) {
            res.set(day, end - start)
            break
        }
        res.set(day, newStart - start)
        start = newStart
    }
    return res
}