import { rstest } from '@rstest/core'
import {
    dateMinute2Idx, hasLimited, hasWeeklyLimited, isEffective, matchCond, matches, meetLimit, meetTimeLimit,
    period2Str,
} from "@util/limit"

describe('util/limit', () => {
    test('matches', () => {
        const cond = [
            'www.baidu.com', '+www.baidu.com/**',
            '*.google.com',
            'github.com/sheepzh',
            '+github.com/sheepzh/time-tracker-4-browser',
            '+www.bilibili.com/cheese',
            '*.bilibili.com*',
        ]

        expect(matches(cond, 'https://www.baidu.com')).toBe(true)
        expect(matches(cond, 'http://www.baidu.com/')).toBe(true)
        expect(matches(cond, 'http://hk.google.com')).toBe(true)
        expect(matches(cond, 'http://github.com/sheepzh/poetry')).toBe(true)
        expect(matches(cond, 'http://github.com/sheepzh/time-tracker-4-browser')).toBe(false)
        expect(matches(cond, 'http://github.com/sheepzh/time-tracker-4-browser/test')).toBe(false)
        expect(matches(cond, 'http://www.bilibili.com/cheese/list')).toBe(false)
        expect(matches(cond, 'http://t.bilibili.com/')).toBe(true)
        expect(matches(cond, 'https://www.bilibili.com/video/BV3527/')).toBe(true)
    })

    test('matchCond', () => {
        const cond = ['www.baidu.com', '*.google.com', 'github.com/sheepzh', 'github.com', '+www.bilibili.com/cheese', '*.bilibili.com*']
        expect(matchCond(cond, 'http://www.baidu.com')).toEqual(['www.baidu.com'])
        expect(matchCond(cond, 'https://github.com/sheepzh/time-tracker-for-browser')).toEqual(['github.com', 'github.com/sheepzh'])
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
        const delay5 = { duration: 5, allow: false as boolean, count: 0 }

        expect(meetTimeLimit({ wasted: 0, maxLimit: 0 }, { ...delay5, allow: false })).toBe(false)

        expect(meetTimeLimit({ wasted: 1001, maxLimit: 1 }, { ...delay5, allow: false })).toBe(true)
        expect(meetTimeLimit({ wasted: 1001, maxLimit: 1 }, { duration: 5, allow: true, count: 0 })).toBe(true)
        expect(meetTimeLimit({ wasted: 1001, maxLimit: 1 }, { duration: 5, allow: true, count: 1 })).toBe(false)
        expect(meetTimeLimit({ wasted: (1 + 60 * 5) * 1000 + 1, maxLimit: 1 }, { duration: 5, allow: true, count: 1 })).toBe(true)
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

        rstest.useFakeTimers({})
        const monday = new Date()
        monday.setFullYear(2025)
        monday.setMonth(0)
        monday.setDate(20)
        rstest.setSystemTime(monday)

        expect(isEffective([1, 2])).toBe(false)
        expect(isEffective([0, 1, 2])).toBe(true)
        rstest.useRealTimers()
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

        expect(hasWeeklyLimited(item, 5)).toBe(false)

        item.weekly = 299
        expect(hasWeeklyLimited(item, 5)).toBe(false)

        item.weeklyWaste = 299 * 1000 + 1
        expect(hasWeeklyLimited(item, 5)).toBe(true)

        item.weeklyDelayCount = 1
        expect(hasWeeklyLimited(item, 5)).toBe(true)

        item.allowDelay = true
        expect(hasWeeklyLimited(item, 5)).toBe(false)
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
            expect(hasLimited(item, 5)).toBe(limited)
        }

        assert(item => item.waste = 1000, false)
        assert(item => item.waste = 1001, true)

        assert(item => item.weeklyWaste = 1000, false)
        assert(item => item.weeklyWaste = 1001, true)
    })
})