import { calculate, getMaxDivisiblePeriod, merge } from "@service/components/period-calculator"
import { keyOf, PERIOD_PER_DATE } from "@util/period"
import { MILL_PER_DAY } from "@util/time"

function resultOf(date: Date | number, orderNum: number, milliseconds: number): timer.period.Result {
    return { ...keyOf(date, orderNum), milliseconds }
}

function timestampOf(base: Date, hour: number, minute: number, second: number, mill: number) {
    const date = new Date(base)
    date.setHours(hour)
    date.setMinutes(minute)
    date.setSeconds(second)
    date.setMilliseconds(mill)
    return date.getTime()
}

/**
 * Cross one minute or not
 */
test('', () => {
    const base = new Date()
    // 13:22:56 876
    const ts1 = timestampOf(base, 13, 22, 56, 876)
    let result = calculate(ts1, 877)
    expect(result.length).toEqual(1)
    let current = result[0]
    let realCurrent: timer.period.Result = resultOf(base, 1 + 13 * 4, 877)
    expect(current).toEqual(realCurrent)

    result = calculate(ts1, (7 * 60 + 56) * 1000 + 877)
    expect(result.length).toEqual(2)
    const last = result[0]
    const realLast: timer.period.Result = resultOf(base, 13 * 4, 1)
    expect(last).toEqual(realLast)
    current = result[1]
    realCurrent.milliseconds = (7 * 60 + 56) * 1000 + 876
    expect(current).toEqual(realCurrent)
})

/**
 * Cross one day
 */
test('', () => {
    const base = new Date()

    // 00:00:02 876
    const ts1 = timestampOf(base, 0, 0, 2, 876)
    const yesterday = ts1 - MILL_PER_DAY

    let result = calculate(ts1, 3000)

    expect(result.length).toEqual(2)
    const last = result[0]
    const realLast: timer.period.Result = resultOf(yesterday, 95, 3000 - 2876)
    expect(last).toEqual(realLast)
    const current = result[1]
    const realCurrent: timer.period.Result = resultOf(base, 0, 2876)
    expect(current).toEqual(realCurrent)
})

test('', () => {
    const dateArr = [2020, 6, 6]

    const key = keyOf(new Date(2020, 5, 6))
    key.order = 4
    let result = getMaxDivisiblePeriod(key, 1)
    expect([result.year, result.month, result.date, result.order]).toEqual([...dateArr, 4])

    key.order = 3
    result = getMaxDivisiblePeriod(key, 1)
    expect([result.year, result.month, result.date, result.order]).toEqual([...dateArr, 3])

    key.order = 0
    result = getMaxDivisiblePeriod(key, 2)
    expect([result.year, result.month, result.date, result.order]).toEqual([2020, 6, 5, 95])
})

test('merge', () => {
    // 20200501
    const start = new Date(2020, 4, 1)
    // 20200531
    const end = new Date(2020, 4, 31)

    const d20200506 = new Date(2020, 4, 6)
    const toMerge: timer.period.Result[] = [
        resultOf(d20200506, 19, 20),
        resultOf(d20200506, 18, 20),
        resultOf(d20200506, 20, 20),
        resultOf(new Date(2020, 4, 20), 20, 20),
    ]

    let result = merge(toMerge, { periodSize: 1, start: keyOf(start, 0), end: keyOf(end, 3) })
    expect(result.length).toEqual(30 * PERIOD_PER_DATE + 4)
    expect(result.filter(p => p.date === '20200506' && p.milliseconds > 0).length).toEqual(3)
    let milliseconds = result.filter(p => p.date === '20200506').map(p => p.milliseconds).reduce((a, b) => a + b, 0)
    expect(milliseconds).toEqual(60)

    result = merge(toMerge, { periodSize: 4, start: keyOf(new Date(2020, 4, 11), 0), end: keyOf(end, 3) })
    expect(result.length).toEqual(20 * PERIOD_PER_DATE / 4 + 4 / 4)
    result = merge(toMerge, { periodSize: 2, start: keyOf(start, 0), end: keyOf(end, 3) })
    expect(result.length).toEqual(30 * PERIOD_PER_DATE / 2 + 4 / 2)
})