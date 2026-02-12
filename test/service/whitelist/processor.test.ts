import WhitelistProcessor from '@service/whitelist/processor'

describe('whitelist-holder', () => {
    let processor: WhitelistProcessor

    beforeEach(() => processor = new WhitelistProcessor())

    const verify = (whitelist: string[], cases: Array<[string, string, boolean]>) => {
        processor.setWhitelist(whitelist)
        cases.forEach(([host, url, expected]) => expect(processor.contains(host, url)).toBe(expected))
    }

    test('setWhitelist basic', () => {
        processor.setWhitelist([])
        expect(processor.contains("github.com", "https://github.com/")).toBeFalsy()

        processor.setWhitelist(['', 'github.com', '', null as any, undefined as any])
        expect(processor.contains("github.com", "https://github.com/")).toBeTruthy()

        processor.setWhitelist(['google.com'])
        expect(processor.contains("github.com", "https://github.com/")).toBeFalsy()
        expect(processor.contains("google.com", "https://google.com/")).toBeTruthy()
    })

    test('normal hosts', () => {
        verify(["www.google.com", "github.com"], [
            ["github.com", "", true],
            ["github.com", "https://unrelated.com/", true],  // URL ignored
            ["www.google.com", "http://www.google.com/search", true],
            ["www.github.com", "https://www.github.com/", false],
            ["google.com", "https://google.com/", false],
        ])
    })

    test('virtual hosts with wildcards', () => {
        verify(["github.com/*", "*.google.com/**", "*.example.com/path/*"], [
            // Single wildcard: matches one level
            ["", "https://github.com/sheepzh", true],
            ["", "https://github.com", false],
            ["", "https://github.com/sheepzh/timer", false],
            // Host wildcard
            ["", "http://map.google.com/search", true],
            ["", "http://foo.bar.google.com/path", true],
            ["", "https://google.com/", false],
            // Complex pattern
            ["", "https://sub.example.com/path/to", true],
            ["", "https://sub.example.com/path/to/nested", false],
        ])

        verify(["gitlab.com/**"], [
            // Double wildcard: matches any depth
            ["", "https://gitlab.com/", true],
            ["", "https://gitlab.com/group/project/issues", true],
        ])
    })

    test('exclude patterns', () => {
        verify(
            ["github.com", "*.google.com/**", "+github.com/login", "+www.google.com/**"],
            [
                ["github.com", "https://github.com/", true],
                ["github.com", "https://github.com/login", false],
                ["", "http://map.google.com/search", true],
                ["", "https://www.google.com/search", false],
            ]
        )

        verify(["example.com/**", "+example.com/admin/**", "+example.com/login"], [
            ["", "https://example.com/page", true],
            ["", "https://example.com/login", false],
            ["", "https://example.com/admin/dashboard", false],
        ])
    })

    test('mixed patterns', () => {
        verify(["example.com", "test.com/**", "github.com", "*.example.com/**"], [
            // Normal host: only checks host param
            ["example.com", "https://other.com/", true],
            ["other.com", "https://example.com/", false],
            // Virtual host: checks URL
            ["", "https://test.com/path", true],
            ["", "https://other.com/path", false],
            // Empty host param: only virtual patterns work
            ["", "https://github.com/", false],
            ["", "https://sub.example.com/path", true],
        ])
    })

    test('edge cases', () => {
        // Trailing slashes, special chars, duplicates, long list
        verify(["github.com/**", "example.com/path-with-dash/**"], [
            ["", "https://github.com/", true],
            ["", "https://github.com", true],
            ["", "https://example.com/path-with-dash/page", true],
            ["", "https://example.com/path_with_dash/page", false],
        ])

        processor.setWhitelist(['github.com', 'github.com'])
        expect(processor.contains("github.com", "")).toBeTruthy()

        const longList = Array.from({ length: 100 }, (_, i) => `site${i}.com`)
        processor.setWhitelist(longList)
        expect(processor.contains("site0.com", "")).toBeTruthy()
        expect(processor.contains("site99.com", "")).toBeTruthy()
        expect(processor.contains("site100.com", "")).toBeFalsy()
    })
})