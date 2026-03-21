import { copyKeyWith, keyOf, compare } from "@util/period"

test('test1', () => {
    const key1 = keyOf(new Date(), 0)
    const key2 = copyKeyWith(key1, 1)

    expect(compare(key1, key2) < 0).toBeTruthy()
    expect(compare(key1, key1) === 0).toBeTruthy()
})

test('test2', () => {
    const a = keyOf(new Date(2020, 4, 20), 15)
    const b = keyOf(new Date(2020, 4, 20), 19)
    expect(compare(a, b) < 0).toBeTruthy()
})