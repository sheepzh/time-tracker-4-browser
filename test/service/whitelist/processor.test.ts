import WhitelistProcessor from '@service/whitelist/processor'

describe('whitelist-holder', () => {
    let processor: WhitelistProcessor

    beforeEach(() => processor = new WhitelistProcessor())

    test('normal', () => {
        processor.setWhitelist([
            "www.google.com",
            "github.com",
        ])
        expect(processor.contains("github.com", "")).toBeTruthy()
        expect(processor.contains("www.github.com", "")).toBeFalsy()
        expect(processor.contains("www.google.com", "http://www.google.com/search")).toBeTruthy()
    })

    test('wildcards', () => {
        processor.setWhitelist([
            "www.github.com",
            "*.google.com/**",
            "+www.google.com/**",
        ])
        expect(processor.contains("google.com", "https://google.com/")).toBeFalsy()
        expect(processor.contains("", "http://map.google.com/search")).toBeTruthy()

        // virtual sites only use url
        expect(processor.contains("www.google.com", "https://foo.bar.google.com/")).toBeTruthy()
        // hit "+www.google.com/**"
        expect(processor.contains("www.google.com", "https://www.google.com/")).toBeFalsy()
    })
})