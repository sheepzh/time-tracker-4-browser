/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getStartOfNextDay, isSameDay } from "@util/time"

test("is same day", () => {
    const date1 = new Date(2022, 4, 11)
    date1.setHours(23)
    const date2 = new Date(2022, 4, 11)
    date2.setHours(10)
    expect(isSameDay(date1, date2)).toBeTruthy()
    date1.setHours(25)
    expect(isSameDay(date1, date2)).toBeFalsy()
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