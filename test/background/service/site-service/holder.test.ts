import siteHolder from '@service/site-service/holder'

const NORMAL_HOST = 'holder-normal.example.com'
const VIRTUAL_HOST = 'holder-virtual.example.com/**'
const VIRTUAL_HOST_WHITE = 'holder-virtual-white.example.com/**'
const TARGET_URL = 'https://holder-virtual.example.com/a/b'
const TARGET_URL_WHITE = 'https://holder-virtual-white.example.com/a/b'
const NOT_MATCH_URL = 'https://holder-no-match.example.com/'

describe('site-service/holder', () => {
    beforeEach(() => {
        siteHolder.onDeleted({ host: NORMAL_HOST, type: 'normal' })
        siteHolder.onDeleted({ host: VIRTUAL_HOST, type: 'virtual' })
        siteHolder.onDeleted({ host: VIRTUAL_HOST_WHITE, type: 'virtual' })
    })

    describe('matchVirtual', () => {
        test('returns matched virtual sites', async () => {
            siteHolder.buildWith({ host: VIRTUAL_HOST, type: 'virtual', options: { white: false } })

            const matched = await siteHolder.matchVirtual(TARGET_URL)
            expect(matched.map(site => site.host)).toContain(VIRTUAL_HOST)
        })
    })

    describe('onDeleted', () => {
        test('removes virtual site from matching set', async () => {
            siteHolder.buildWith({ host: VIRTUAL_HOST, type: 'virtual' })
            expect(await siteHolder.matchVirtual(TARGET_URL)).toHaveLength(1)

            siteHolder.onDeleted({ host: VIRTUAL_HOST, type: 'virtual' })
            expect(await siteHolder.matchVirtual(TARGET_URL)).toEqual([])
        })
    })

    describe('isWhitelist', () => {
        test('handles host and virtual whitelist rules', async () => {
            // Host whitelist works when no virtual site matched.
            siteHolder.buildWith({ host: NORMAL_HOST, type: 'normal', options: { white: true } })
            expect(await siteHolder.isWhitelist(NORMAL_HOST, NOT_MATCH_URL)).toBe(true)

            // Normal site update should take effect.
            siteHolder.buildWith({ host: NORMAL_HOST, type: 'normal', options: { white: false } })
            expect(await siteHolder.isWhitelist(NORMAL_HOST, NOT_MATCH_URL)).toBe(false)

            // All matched virtual sites are white => true.
            siteHolder.buildWith({ host: VIRTUAL_HOST_WHITE, type: 'virtual', options: { white: true } })
            expect(await siteHolder.isWhitelist('other-host.example.com', TARGET_URL_WHITE)).toBe(true)

            // Any matched virtual site not white => false, even if host is white.
            siteHolder.buildWith({ host: NORMAL_HOST, type: 'normal', options: { white: true } })
            siteHolder.buildWith({ host: VIRTUAL_HOST, type: 'virtual', options: { white: false } })
            expect(await siteHolder.isWhitelist(NORMAL_HOST, TARGET_URL)).toBe(false)
        })

        test('returns false when mixed matched virtual sites include a non-white one', async () => {
            const mixedVirtualWhite = 'holder-virtual.example.com/*'
            siteHolder.buildWith({ host: mixedVirtualWhite, type: 'virtual', options: { white: true } })
            siteHolder.buildWith({ host: VIRTUAL_HOST, type: 'virtual', options: { white: false } })

            expect(await siteHolder.isWhitelist('other-host.example.com', TARGET_URL)).toBe(false)

            siteHolder.onDeleted({ host: mixedVirtualWhite, type: 'virtual' })
        })
    })
})
