/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { allMatch, anyMatch, average, groupBy, rotate, sum, toMap } from "@util/array"

describe("util/array", () => {

    test('group by', () => {
        const arr = [
            [1, 2],
            [1, 3],
            [2, 3],
            [3, 4],
            [2, 9]
        ]
        // Find the max value of each group
        const maxMap = groupBy(arr, a => a[0], arr => Math.max(...arr.map(a => a[1])))
        expect(maxMap).toEqual({
            1: 3,
            2: 9,
            3: 4
        })
        const allVal = groupBy(arr, _ => undefined, arr => arr.map(a => a[1]))
        expect(allVal).toEqual({})
    })

    test("rotate", () => {
        const arr = [1, 2, 3, 4, 5, 6]
        // Left rotate for 1 time
        rotate(arr)
        expect(arr).toEqual([2, 3, 4, 5, 6, 1])
        // Left rotate again for 2 times
        rotate(arr, 2, false)
        expect(arr).toEqual([4, 5, 6, 1, 2, 3])
        // Right rotate for 3 times
        rotate(arr, 3, true)
        expect(arr).toEqual([1, 2, 3, 4, 5, 6])
    })

    test("sum", () => {
        let arr: number[] = [1, 2, 3, 4]
        expect(10).toEqual(sum(arr))

        arr = []
        expect(0).toEqual(sum(arr))
    })

    test("average", () => {
        expect(average([10, 1])).toEqual(11 / 2)
        expect(average([])).toBeNull()
        expect(average([0])).toEqual(0)
    })

    test("allMatch", () => {
        const arr = [100, 20, 30]
        expect(allMatch(arr, a => a >= 20)).toBeTruthy()
        expect(allMatch(arr, a => a > 20)).toBeFalsy()
    })

    test("anyMatch", () => {
        const arr = [100, 20, 30]
        expect(anyMatch(arr, a => a >= 100)).toBeTruthy()
        expect(anyMatch(arr, a => a > 100)).toBeFalsy()
    })
})

describe('toMap', () => {

    const users = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
        { id: 3, name: 'Charlie', role: 'guest' },
    ]

    const products = [
        { id: 'p1', name: 'Laptop', price: 1200 },
        { id: 'p2', name: 'Mouse', price: 25 },
        { id: 'p3', name: 'Keyboard', price: 75 },
    ]

    test('should create a map with array elements as values when valFunc is not provided', () => {
        const userMap = toMap(users, u => u.id)
        expect(userMap).toEqual({
            1: { id: 1, name: 'Alice', role: 'admin' },
            2: { id: 2, name: 'Bob', role: 'user' },
            3: { id: 3, name: 'Charlie', role: 'guest' },
        })
    })

    test('should create a map with transformed values when valFunc is provided', () => {
        const userRolesMap = toMap(users, u => u.id, u => u.role)
        expect(userRolesMap).toEqual({
            1: 'admin',
            2: 'user',
            3: 'guest',
        })
    })

    test('should handle string keys correctly', () => {
        const productMap = toMap(products, p => p.id)

        expect(productMap).toEqual({
            'p1': { id: 'p1', name: 'Laptop', price: 1200 },
            'p2': { id: 'p2', name: 'Mouse', price: 25 },
            'p3': { id: 'p3', name: 'Keyboard', price: 75 },
        })
    })

    test('should return an empty map for an empty array', () => {
        const emptyArray: any[] = []
        const emptyMap = toMap(emptyArray, i => i.id)
        expect(emptyMap).toEqual({})
    })

    test('should overwrite existing keys with later elements', () => {
        const usersWithDuplicateKey = [
            { id: 1, name: 'Alice', role: 'admin' },
            { id: 2, name: 'Bob', role: 'user' },
            { id: 1, name: 'John', role: 'guest' }, // ID 1 重复
        ]

        const userMap = toMap(usersWithDuplicateKey, u => u.id)

        expect(userMap).toEqual({
            1: { id: 1, name: 'John', role: 'guest' },
            2: { id: 2, name: 'Bob', role: 'user' },
        })
    })
})
