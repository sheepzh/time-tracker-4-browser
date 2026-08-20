import type Dispatcher from '@cs/dispatcher'
import LocationWatcher from '@cs/location-watcher'

const createDispatcher = (): Dispatcher => ({
    register: rstest.fn(() => ({}) as unknown as Dispatcher),
}) as unknown as Dispatcher

describe('LocationWatcher', () => {
    beforeEach(() => history.replaceState({}, '', '/'))

    test('pushState triggers handler immediately', async () => {
        const handler = rstest.fn()
        const watcher = new LocationWatcher()
        await watcher.init(createDispatcher())
        watcher.onCurrChange(handler)

        history.pushState({}, '', '/page-a')
        // Wait for interval to trigger the handler
        await new Promise(resolve => setTimeout(resolve, 1000))

        expect(handler).toHaveBeenCalledTimes(1)
        expect(watcher.url).toBe(`${window.location.origin}/page-a`)

        watcher.dispose()
    })

    test('replaceState triggers handler immediately', async () => {
        const handler = rstest.fn()
        const watcher = new LocationWatcher()
        await watcher.init(createDispatcher())
        watcher.onCurrChange(handler)

        history.replaceState({}, '', '/page-b')
        // Wait for interval to trigger the handler
        await new Promise(resolve => setTimeout(resolve, 1000))

        expect(handler).toHaveBeenCalledTimes(1)
        expect(watcher.url).toBe(`${window.location.origin}/page-b`)
        watcher.dispose()
    })

    test('popstate still triggers handler', async () => {
        history.replaceState({}, '', '/')
        const rootUrl = window.location.href
        history.pushState({}, '', '/page-a')
        const handler = rstest.fn()
        const watcher = new LocationWatcher()
        await watcher.init(createDispatcher())
        watcher.onCurrChange(handler)

        const popstate = new Promise<void>(resolve => {
            window.addEventListener('popstate', () => resolve(), { once: true })
        })
        history.back()
        await popstate
        // Wait for interval to trigger the handler
        await new Promise(resolve => setTimeout(resolve, 1000))

        expect(handler).toHaveBeenCalledTimes(1)
        expect(watcher.url).toBe(rootUrl)
        watcher.dispose()
    })
})
