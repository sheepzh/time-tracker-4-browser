import {
    calcTimeState, cleanCond, dateMinute2Idx, hasLimited, hasWeeklyLimited, isEffective, isEnabledAndEffective,
    matchCond, matches, meetLimit, meetTimeLimit, period2Str
} from "@util/limit"

describe('util/limit', () => {
    test('cleanCond', () => {
        expect(cleanCond('https://github.com?a=2')).toEqual('github.com')
        expect(cleanCond('https://github.com/?a=2')).toEqual('github.com')
        expect(cleanCond('*://github.com/?a=2')).toEqual('github.com')
        expect(cleanCond('www.github.com/sheepzh/?a=2')).toEqual('www.github.com/sheepzh')
        expect(cleanCond('https://')).toBeUndefined()
    })

    test('matches', () => {
        const cond = ['www.baidu.com', '*.google.com', 'github.com/sheepzh', '+github.com/sheepzh/timer','+www.bilibili.com/cheese','*.bilibili.com*']

        expect(matches(cond, 'https://www.baidu.com')).toBe(true)
        expect(matches(cond, 'http://hk.google.com')).toBe(true)
        expect(matches(cond, 'http://github.com/sheepzh/poetry')).toBe(true)
        expect(matches(cond, 'http://github.com/sheepzh/timer')).toBe(false)
        expect(matches(cond, 'http://github.com/sheepzh/timer/test')).toBe(false)
        expect(matches(cond, 'http://www.bilibili.com/cheese/list')).toBe(false)
        expect(matches(cond, 'http://t.bilibili.com/')).toBe(true)
        expect(matches(cond, 'https://www.bilibili.com/video/BV3527/')).toBe(true)
    })
    
    test('matchCond', () => {
        const cond = ['www.baidu.com', '*.google.com', 'github.com/sheepzh', 'github.com','+www.bilibili.com/cheese','*.bilibili.com*']
        expect(matchCond(cond, 'http://www.baidu.com')).toEqual(['www.baidu.com'])
        expect(matchCond(cond, 'https://github.com/sheepzh/time-tracker-for-browser')).toEqual(['github.com/sheepzh', 'github.com'])
        expect(matchCond(cond, 'https://www.github.com')).toEqual([])
        expect(matchCond(cond, 'https://www.bilibili.com/cheese/list')).toEqual([])
        expect(matchCond(cond, 'https://www.bilibili.com/vedio')).toEqual(['*.bilibili.com*'])
    })

    test('meetLimit', () => {
        expect(meetLimit(undefined, undefined)).toBe(false)
        expect(meetLimit(1, undefined)).toBe(false)
        expect(meetLimit(1, 0)).toBe(false)
        expect(meetLimit(0, 100)).toBe(false)
        expect(meetLimit(undefined, 100)).toBe(false)

        expect(meetLimit(100, 101)).toBe(true)
        expect(meetLimit(100, 100)).toBe(false)
    })

    test('meetTimeLimit', () => {
        expect(meetTimeLimit(undefined, undefined, undefined, undefined)).toBe(false)

        expect(meetTimeLimit(1, 1001, undefined, undefined)).toBe(true)
        expect(meetTimeLimit(1, 1001, true, undefined)).toBe(true)
        expect(meetTimeLimit(1, 1001, true, 1)).toBe(false)
        expect(meetTimeLimit(1, (1 + 60 * 5) * 1000 + 1, true, 1)).toBe(true)
    })

    test('period2Str', () => {
        expect(period2Str(undefined)).toBe('00:00-00:00')
        expect(period2Str([0, 100])).toBe('00:00-01:40')
        expect(period2Str([100, 900])).toBe('01:40-15:00')
    })

    test('dateMinute2Idx', () => {
        const date = new Date()
        date.setHours(20)
        date.setMinutes(6)
        expect(dateMinute2Idx(date)).toEqual(20 * 60 + 6)
    })

    test('isEffective', () => {
        expect(isEffective(undefined)).toBe(true)
        expect(isEffective([])).toBe(true)

        Object.defineProperty(global, 'performance', { writable: true })
        jest.useFakeTimers({ doNotFake: ['performance'] })
        const monday = new Date()
        monday.setFullYear(2025)
        monday.setMonth(0)
        monday.setDate(20)
        jest.setSystemTime(monday)

        expect(isEffective([1, 2])).toBe(false)
        expect(isEffective([0, 1, 2])).toBe(true)
    })

    test('isEffectiveAndEnabled', () => {
        Object.defineProperty(global, 'performance', { writable: true })
        jest.useFakeTimers({ doNotFake: ['performance'] })
        const monday = new Date()
        monday.setFullYear(2025)
        monday.setMonth(0)
        monday.setDate(20)
        jest.setSystemTime(monday)

        const rule = (weekdays: number[], enabled: boolean): timer.limit.Rule => ({
            id: 1, name: 'foobar',
            cond: [],
            time: 0, weekdays,
            enabled, allowDelay: false, locked: false,
        })

        expect(isEnabledAndEffective(rule([0, 1, 2], true))).toBe(true)
        expect(isEnabledAndEffective(rule([0, 1, 2], false))).toBe(false)
        expect(isEnabledAndEffective(rule([1, 2], true))).toBe(false)
    })

    test('hasWeeklyLimited', () => {
        const item: timer.limit.Item = {
            id: 1,
            name: 'foobar',
            cond: [],
            time: 0,
            waste: 0,
            visit: 0,
            delayCount: 0,
            weeklyWaste: 0,
            weeklyVisit: 0,
            weeklyDelayCount: 0,
            enabled: true,
            allowDelay: false,
            locked: false,
        }

        expect(hasWeeklyLimited(item)).toBe(false)

        item.weekly = 299
        expect(hasWeeklyLimited(item)).toBe(false)

        item.weeklyWaste = 299 * 1000 + 1
        expect(hasWeeklyLimited(item)).toBe(true)

        item.weeklyDelayCount = 1
        expect(hasWeeklyLimited(item)).toBe(true)

        item.allowDelay = true
        expect(hasWeeklyLimited(item)).toBe(false)
    })

    test('calcTimeState', () => {
        const item: timer.limit.Item = {
            id: 1,
            name: 'foobar',
            cond: [],
            time: 10,
            weekly: 10,
            waste: 0,
            visit: 0,
            delayCount: 0,
            weeklyWaste: 0,
            weeklyVisit: 0,
            weeklyDelayCount: 0,
            enabled: true,
            allowDelay: false,
            locked: false,
        }
        const duration = 1000

        type LimitState = 'NORMAL' | 'REMINDER' | 'LIMITED'

        const assert = (daily: LimitState, weekly: LimitState) => {
            const res = calcTimeState(item, duration)
            expect(res?.daily).toBe(daily)
            expect(res?.weekly).toBe(weekly)
        }

        item.waste = 9000
        assert('NORMAL', 'NORMAL')

        item.waste = 9001
        assert('REMINDER', 'NORMAL')

        item.waste = 10001
        assert('LIMITED', 'NORMAL')

        item.allowDelay = true
        item.delayCount = 1

        item.weeklyWaste = 9000
        assert('NORMAL', 'NORMAL')
        item.weeklyWaste = 9001
        assert('NORMAL', 'REMINDER')
        item.weeklyWaste = 10001
        assert('NORMAL', 'LIMITED')
    })

    test('hasLimit', () => {
        const assert = (setup: (item: timer.limit.Item) => void, limited: boolean) => {
            const item: timer.limit.Item = {
                id: 1,
                name: 'foobar',
                cond: [],
                time: 1,
                weekly: 1,
                waste: 0,
                visit: 0,
                delayCount: 0,
                weeklyWaste: 0,
                weeklyVisit: 0,
                weeklyDelayCount: 0,
                enabled: true,
                allowDelay: false,
                locked: false,
            }
            setup(item)
            expect(hasLimited(item)).toBe(limited)
        }

        assert(item => item.waste = 1000, false)
        assert(item => item.waste = 1001, true)

        assert(item => item.weeklyWaste = 1000, false)
        assert(item => item.weeklyWaste = 1001, true)
    })
})