import LocationWatcher from '@cs/location-watcher'

describe('LocationWatcher', () => {
    beforeEach(() => history.replaceState({}, '', '/'))

    test('pushState triggers handler immediately', async () => {
        const initialUrl = window.location.href
        const host = window.location.host
        const handler = rstest.fn()
        const watcher = new LocationWatcher()
        watcher.onChange(handler)
        watcher.init()

        history.pushState({}, '', '/page-a')
        // Wait for interval to trigger the handler
        await new Promise(resolve => setTimeout(resolve, 1000))

        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith({
            nextUrl: `${window.location.origin}/page-a`,
            prevUrl: initialUrl,
            nextHost: host,
            prevHost: host
        })

        watcher.dispose()
    })

    test('replaceState triggers handler immediately', async () => {
        const initialUrl = window.location.href
        const host = window.location.host
        const handler = rstest.fn()
        const watcher = new LocationWatcher()
        watcher.onChange(handler)
        watcher.init()

        history.replaceState({}, '', '/page-b')
        // Wait for interval to trigger the handler
        await new Promise(resolve => setTimeout(resolve, 1000))

        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith({
            nextUrl: `${window.location.origin}/page-b`,
            prevUrl: initialUrl,
            nextHost: host,
            prevHost: host,
        })

        watcher.dispose()
    })

    test('popstate still triggers handler', async () => {
        history.replaceState({}, '', '/')
        const rootUrl = window.location.href
        history.pushState({}, '', '/page-a')
        const pageAUrl = window.location.href
        const handler = rstest.fn()
        const watcher = new LocationWatcher()
        watcher.onChange(handler)
        watcher.init()

        const popstate = new Promise<void>(resolve => {
            window.addEventListener('popstate', () => resolve(), { once: true })
        })
        history.back()
        await popstate
        // Wait for interval to trigger the handler
        await new Promise(resolve => setTimeout(resolve, 1000))

        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith({
            nextUrl: rootUrl,
            prevUrl: pageAUrl,
            nextHost: window.location.host,
            prevHost: window.location.host,
        })

        watcher.dispose()
    })

    test('dispose restores native history methods', () => {
        const nativePushState = history.pushState
        const nativeReplaceState = history.replaceState
        const handler = rstest.fn()
        const watcher = new LocationWatcher()
        watcher.onChange(handler)
        watcher.init()

        watcher.dispose()

        expect(history.pushState).toBe(nativePushState)
        expect(history.replaceState).toBe(nativeReplaceState)
        history.pushState({}, '', '/page-after-dispose')
        expect(handler).not.toHaveBeenCalled()
    })
})
