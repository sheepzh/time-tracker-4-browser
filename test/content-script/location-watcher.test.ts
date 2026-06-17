import LocationWatcher from '@cs/location-watcher'

describe('LocationWatcher', () => {
    beforeEach(() => {
        history.replaceState({}, '', '/')
    })

    test('pushState triggers handler immediately', () => {
        const initialUrl = window.location.href
        const handler = rstest.fn()
        const watcher = new LocationWatcher(initialUrl, handler)
        watcher.init()

        history.pushState({}, '', '/page-a')

        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith(`${window.location.origin}/page-a`, initialUrl)

        watcher.dispose()
    })

    test('replaceState triggers handler immediately', () => {
        const initialUrl = window.location.href
        const handler = rstest.fn()
        const watcher = new LocationWatcher(initialUrl, handler)
        watcher.init()

        history.replaceState({}, '', '/page-b')

        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith(`${window.location.origin}/page-b`, initialUrl)

        watcher.dispose()
    })

    test('popstate still triggers handler', async () => {
        history.replaceState({}, '', '/')
        const rootUrl = window.location.href
        history.pushState({}, '', '/page-a')
        const pageAUrl = window.location.href
        const handler = rstest.fn()
        const watcher = new LocationWatcher(pageAUrl, handler)
        watcher.init()

        const popstate = new Promise<void>(resolve => {
            window.addEventListener('popstate', () => resolve(), { once: true })
        })
        history.back()
        await popstate

        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith(rootUrl, pageAUrl)

        watcher.dispose()
    })

    test('dispose restores native history methods', () => {
        const nativePushState = history.pushState
        const nativeReplaceState = history.replaceState
        const handler = rstest.fn()
        const watcher = new LocationWatcher(window.location.href, handler)
        watcher.init()

        watcher.dispose()

        expect(history.pushState).toBe(nativePushState)
        expect(history.replaceState).toBe(nativeReplaceState)
        history.pushState({}, '', '/page-after-dispose')
        expect(handler).not.toHaveBeenCalled()
    })

    test('init is idempotent', () => {
        const handler = rstest.fn()
        const watcher = new LocationWatcher(window.location.href, handler)
        watcher.init()
        watcher.init()

        history.pushState({}, '', '/page-a')

        expect(handler).toHaveBeenCalledTimes(1)

        watcher.dispose()
    })
})
