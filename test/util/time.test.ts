/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import {
    daysAgo, formatPeriodCommon, formatTime, getAllDatesBetween, getDayLength, getMonthTime, getStartOfDay, isSameDay,
} from "@util/time"

test('time', () => {
    const dateStr = '2020/05/01 00:00:01'
    const date = Date.parse(dateStr)
    const format = '{y}{m}{d} {h}{i}{s}{a}'
    const result = '20200501 000001五'

    // default format
    expect(formatTime(date, format)).toEqual(result)
    // use seconds
    expect(formatTime(Math.floor(date / 1000), format)).toEqual(result)

    expect(formatTime(new Date(date), format)).toEqual(result)
})

test('format', () => {
    expect(formatPeriodCommon(86400 * 1000)).toEqual('1d 0h 0m 0s')
    expect(formatPeriodCommon(3666 * 1000)).toEqual('1h 1m 6s')
    expect(formatPeriodCommon(1)).toEqual('0s')
})

test('days ago', () => {
    const start = Math.floor(Math.random() * 100)
    const range = daysAgo(start + 2, start)
    expect(range[1].getTime() - range[0].getTime()).toEqual(1000/*ms/s*/ * 60/*s/min*/ * 60/*min/h*/ * 24/*h/day*/ * 2/*day*/)
})

test("is same day", () => {
    const date1 = new Date(2022, 4, 11)
    date1.setHours(23)
    const date2 = new Date(2022, 4, 11)
    date2.setHours(10)
    expect(isSameDay(date1, date2)).toBeTruthy()
    date1.setHours(25)
    expect(isSameDay(date1, date2)).toBeFalsy()
})

test("get month time", () => {
    // 2022/05/02
    const now = new Date(2022, 4, 2)
    const [start, end] = getMonthTime(now)
    expect(start.getMonth()).toEqual(4)
    expect(start.getDate()).toEqual(1)
    expect(start.getHours()).toEqual(0)
    expect(start.getMinutes()).toEqual(0)
    expect(start.getSeconds()).toEqual(0)
    expect(start.getMilliseconds()).toEqual(0)

    expect(end.getMonth()).toEqual(4)
    expect(end.getDate()).toEqual(31)
    expect(end.getHours()).toEqual(23)
    expect(end.getMinutes()).toEqual(59)
    expect(end.getSeconds()).toEqual(59)
    expect(end.getMilliseconds()).toEqual(999)
})

test("get start of day", () => {
    // 2022/05/22 11:30:29
    const now = new Date(2022, 4, 2)
    now.setHours(11, 30, 29, 999)
    const start = getStartOfDay(now)
    expect(start).toEqual(new Date(2022, 4, 2).getTime())
})

describe("getDayLength", () => {
    test("base usage", () => {
        expect(getDayLength(new Date(2022, 4, 1, 3), new Date(2022, 4, 3, 2))).toEqual(3)
        expect(getDayLength(new Date(2022, 7, 30, 23), new Date(2022, 8, 1, 2))).toEqual(3)
    })

    test("the same day", () => {
        const start = new Date(2022, 4, 1, 3).getTime()
        const end = new Date(2022, 4, 1, 2).getTime()
        expect(getDayLength(start, end)).toEqual(0)
        expect(getDayLength(end, start)).toEqual(1)
    })
})

describe("getAllDatesBetween", () => {
    const start = new Date(2022, 4, 1, 3).getTime()
    const end = new Date(2022, 4, 3, 2).getTime()

    test("base usage", () => {
        expect(getAllDatesBetween(start, end)).toEqual(['20220501', '20220502', '20220503'])
        expect(getAllDatesBetween(start, end, d => d.getFullYear().toString())).toEqual(['2022', '2022', '2022'])
    })

    test("the same day", () => {
        const start = new Date(2022, 4, 1, 3).getTime()
        const end = new Date(2022, 4, 1, 2).getTime()
        expect(getAllDatesBetween(start, end)).toEqual([])
        expect(getAllDatesBetween(end, start)).toEqual(['20220501'])
    })
})