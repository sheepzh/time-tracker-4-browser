import { mergeObject } from '@util/lang'

describe('mergeObject', () => {
    test('should merge two objects correctly', () => {
        const a: any = { x: 1, y: { z: 2 } }

        const b: any = { y: { w: 3, z: undefined }, v: 4 }
        const r1 = mergeObject(a, b)
        expect(r1).toEqual({ x: 1, y: { z: undefined, w: 3 }, v: 4 })

        const c: any = { x: 1, y: { z: 2 } }
        const d: any = { y: { z: {} }, v: 4 }
        const r2 = mergeObject(c, d)
        expect(r2).toEqual({ x: 1, y: { z: {} }, v: 4 })
    })
})