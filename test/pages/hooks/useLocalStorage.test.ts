import { localReactive, localRef } from '@pages/hooks/useLocalStorage'
import { createArrayGuard, createObjectGuard, createOptionalGuard, isInt, isString } from 'typescript-guard'
import { nextTick } from 'vue'

describe('Storage Utils Unit Tests (Rspack/Test)', () => {
    beforeEach(() => localStorage.clear())

    describe('localRef', () => {
        it('should use default value when localStorage is empty', () => {
            const numRef = localRef('test-num', isInt, 10)
            expect(numRef.value).toBe(10)
        })

        it('should prioritize and deserialize cached value when localStorage has valid data', () => {
            localStorage.setItem('test-num', JSON.stringify(100))
            const numRef = localRef('test-num', isInt, 10)
            expect(numRef.value).toBe(100)
        })

        it('should fallback to default value when localStorage data fails TypeGuard validation', () => {
            localStorage.setItem('test-num', JSON.stringify('I am a string, not a number'))
            const numRef = localRef('test-num', isInt, 10)
            expect(numRef.value).toBe(10)
        })

        it('should sync to localStorage automatically when ref value changes', async () => {
            const numRef = localRef('test-num', isInt, 10)
            numRef.value = 42

            //must wait for the next tick, since Vue watch is asynchronous
            await nextTick()
            expect(localStorage.getItem('test-num')).toBe(JSON.stringify(42))
        })

        it('should remove the key from localStorage when ref value is set to undefined', async () => {
            localStorage.setItem('test-num', JSON.stringify(100))
            const numRef = localRef('test-num', isInt)
            expect(numRef.value).toBe(100)

            numRef.value = undefined
            await nextTick()
            expect(localStorage.getItem('test-num')).toBeNull()
        })
    })

    describe('localReactive', () => {
        type User = {
            name: string
            age: number
            tags?: string[]
        }

        const isTestUser = createObjectGuard<User>({
            name: isString,
            age: isInt,
            tags: createOptionalGuard(createArrayGuard(isString)),
        })

        const defaultUser: User = { name: 'John Doe', age: 18, tags: ['frontend'] }

        it('should initialize with deep default value when localStorage is empty', () => {
            const user = localReactive<User>('test-user', isTestUser, defaultUser)
            expect(user.name).toBe('John Doe')
            expect(user.age).toBe(18)
        })

        it('should restore the reactive structure when localStorage has valid data', () => {
            const cachedUser = { name: 'Jane Doe', age: 30 }
            localStorage.setItem('test-user', JSON.stringify(cachedUser))

            const user = localReactive('test-user', isTestUser, defaultUser)
            expect(user.name).toBe('Jane Doe')
            expect(user.age).toBe(30)
        })

        it('should trigger deep watch and sync to localStorage when mutating first-level properties', async () => {
            const user = localReactive('test-user', isTestUser, defaultUser)
            user.name = 'Alex'

            await nextTick()
            const stored = JSON.parse(localStorage.getItem('test-user') || '{}')
            expect(stored.name).toBe('Alex')
        })

        it('should trigger deep watch and write raw objects when mutating nested properties', async () => {
            const user = localReactive('test-user', isTestUser, defaultUser)

            // Mutating a nested array
            user.tags?.push('vue3')

            await nextTick()
            const stored = JSON.parse(localStorage.getItem('test-user') || '{}')
            expect(stored.tags).toContain('vue3')
            expect(stored.tags).toHaveLength(2)
        })
    })
})