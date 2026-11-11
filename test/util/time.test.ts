/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getAllDatesBetween, getDayLength, getMonthTime, getStartOfDay, getStartOfNextDay, isSameDay } from "@util/time"

test("is same day", () => {
    const date1 = new Date(2022, 4, 11)
    date1.setHours(23)
    const date2 = new Date(2022, 4, 11)
    date2.setHours(10)
    expect(isSameDay(date1, date2)).toBeTruthy()
    date1.setHours(25)
    expect(isSameDay(date1, date2)).toBeFalsy()
})

describe("date-range helpers", () => {
    test("getStartOfDay floors to midnight in local time", () => {
        const d = new Date(2022, 4, 11, 17, 42, 50, 123)
        expect(getStartOfDay(d)).toBe(new Date(2022, 4, 11).getTime())
    })

    test("getDayLength counts the inclusive start and end dates", () => {
        expect(getDayLength(new Date(2022, 5, 8), new Date(2022, 5, 9))).toBe(2)
        expect(getDayLength(new Date(2022, 5, 9), new Date(2022, 5, 8))).toBe(0)
        expect(getDayLength(new Date(2022, 5, 9, 0, 0, 1), new Date(2022, 5, 9, 0, 0, 1))).toBe(1)
    })

    test("getAllDatesBetween is inclusive and respects month boundaries", () => {
        expect(getAllDatesBetween(new Date(2022, 11, 30, 23), new Date(2023, 0, 2, 1))).toEqual([
            "20221230",
            "20221231",
            "20230101",
            "20230102",
        ])
    })

    test("getMonthTime handles year rollover", () => {
        const [start, end] = getMonthTime(new Date(2022, 11, 31, 12, 30))
        expect(start).toEqual(new Date(2022, 11, 1).getTime())
        expect(end).toEqual(new Date(2023, 0, 1).getTime() - 1)
    })
})

describe("getStartOfNextDay", () => {
    test("base usage", () => {
        const now = new Date(2022, 4, 2, 11, 30, 29, 999)
        expect(getStartOfNextDay(now)).toEqual(new Date(2022, 4, 3).getTime())
        // Month and year boundaries
        expect(getStartOfNextDay(new Date(2022, 11, 31, 23, 59))).toEqual(new Date(2023, 0, 1).getTime())
    })

    test("returns the start of the next local date, including dates without midnight", () => {
        let current = new Date(2026, 0, 1, 12).getTime()
        const end = new Date(2027, 0, 1).getTime()
        while (current < end) {
            const next = getStartOfNextDay(current)
            const date = new Date(current)
            const expected = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            expect(next).toBeGreaterThan(current)
            expect(next).toEqual(expected.getTime())
            current = next + 12 * 60 * 60 * 1000
        }
    })
})