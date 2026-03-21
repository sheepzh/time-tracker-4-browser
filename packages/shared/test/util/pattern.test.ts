import { JSON_HOST, PDF_HOST, PIC_HOST, TXT_HOST } from "@util/constant/remain-host"
import { extractFileHost, extractHostname, isBrowserUrl, isHomepage, isIpAndPort, isValidHost, isValidVirtualHost } from "@util/pattern"

test('browser url', () => {
    // chrome
    expect(isBrowserUrl('chrome://settings/')).toBeTruthy()
    expect(isBrowserUrl('chrome-extension://hkjmfadlepammjmjiihpongliebpcnba/static/app.html#/data/report')).toBeTruthy()
    // firefox
    expect(isBrowserUrl('about:addons')).toBeTruthy()
    // edge
    expect(isBrowserUrl('edge://extensions/')).toBeTruthy()
    expect(isBrowserUrl('extension://ifckodfehjfpfddhjhpejmidkhelbnpa/static/app.html#/additional/option')).toBeTruthy()
    expect(isBrowserUrl('https://www.jss.com.cn/')).toBeFalsy()
})

test('ip and port', () => {
    expect(isIpAndPort('222.222.22.01')).toBeFalsy()
    expect(isIpAndPort('222.222.22.100')).toBeTruthy()
    expect(isIpAndPort('222.222.22.1:1234')).toBeTruthy()
    // 256 is invalid
    expect(isIpAndPort('222.222.22.256')).toBeFalsy()
    expect(isIpAndPort('222.222.22')).toBeFalsy()
    expect(isIpAndPort('222.222.22.2:65535')).toBeTruthy()
    // 65536 is invalid port
    expect(isIpAndPort('222.222.22.2:65536')).toBeFalsy()
    // Regular expression is not valid
    expect(isIpAndPort('222.222.22.2:*')).toBeFalsy()
})

test('merge host origin', () => {
    expect(isValidHost('')).toBeFalsy()

    expect(isValidHost('wwdad.basd.com.111:12345')).toBeTruthy()
    expect(isValidHost('wwdad.basd.com.a111a:12345')).toBeTruthy()
    expect(isValidHost('wwdad.basd.com.a111a:*')).toBeTruthy()
    expect(isValidHost('wwdad.basd.**:12345')).toBeFalsy()
    expect(isValidHost('wwdad.basd.**:65536')).toBeFalsy()
    expect(isValidHost('wwdad.basd.*.*')).toBeTruthy()
    expect(isValidHost('wwdad.basd..*')).toBeFalsy()
    expect(isValidHost('wwdad*.*')).toBeFalsy()
    expect(isValidHost('wwdad.*.*')).toBeTruthy()

    expect(isValidHost('https://ww.baidcom')).toBeFalsy()
})

test("url", () => {
    expect(extractHostname('https://www.baidu.com?1231=123')).toEqual({ host: 'www.baidu.com', protocol: 'https' })
    expect(extractHostname('http://localhost:8087?1231=123')).toEqual({ host: 'localhost:8087', protocol: 'http' })
    expect(extractHostname('http://localhost:8087/')).toEqual({ host: 'localhost:8087', protocol: 'http' })
    expect(extractHostname('http://localhost:8087/?123=123')).toEqual({ host: 'localhost:8087', protocol: 'http' })
    expect(extractHostname('localhost:8087/?123=123')).toEqual({ host: 'localhost:8087', protocol: '' })
    // the url of local files in firefox
    expect(extractHostname("file:///home/zhy/%E4%B8%8B%E8%BD%BD/%E6%88%91%E7%9A%84%E4%B8%8A%E7%BD%91%E6%97%B6%E9%97%B4_20220305_20220305.json"))
        .toEqual({ host: JSON_HOST, protocol: "file" })
})

test("homepage", () => {
    expect(isHomepage("http://baidu.com")).toBeTruthy()
    expect(isHomepage("http://baidu.com/")).toBeTruthy()
    expect(isHomepage("https://baidu.com/")).toBeTruthy()
    expect(isHomepage("baidu.com/")).toBeTruthy()

    expect(isHomepage("baidu.com/a")).toBeFalsy()
    expect(isHomepage("https://baidu.com/a")).toBeFalsy()
    expect(isHomepage("https://baidu.com/a?a=2")).toBeFalsy()
    expect(isHomepage("https://baidu.com?a=2")).toBeFalsy()
})

test("extractFileHost", () => {
    expect(extractFileHost("file://123.json")).toEqual(JSON_HOST)
    expect(extractFileHost("file://123.jpeg")).toEqual(PIC_HOST)
    expect(extractFileHost("file://123.txt")).toEqual(TXT_HOST)
    expect(extractFileHost("file://123.jpeg   ")).toEqual(PIC_HOST)
    expect(extractFileHost("   file://123.jpeg   ")).toEqual(PIC_HOST)
    expect(extractFileHost("file://123.pdf")).toEqual(PDF_HOST)

    expect(extractFileHost("")).toEqual(undefined)
    expect(extractFileHost("         ")).toEqual(undefined)
    expect(extractFileHost("file:/123.json")).toEqual(undefined)
    expect(extractFileHost("file://123.  jpeg")).toEqual(undefined)
    expect(extractFileHost("file://123json")).toEqual(undefined)
    expect(extractFileHost("file://123.html")).toEqual(undefined)
    expect(extractFileHost("file://123.")).toEqual(undefined)
})

test("valid virtual host", () => {
    expect(isValidVirtualHost("github.com")).toBeFalsy()
    expect(isValidVirtualHost("http://github.com")).toBeFalsy()
    expect(isValidVirtualHost("github.com/")).toBeFalsy()

    expect(isValidVirtualHost("github.com/sheepzh")).toBeTruthy()
    expect(isValidVirtualHost("github.com/**")).toBeTruthy()
    expect(isValidVirtualHost("github.com/*")).toBeTruthy()
    expect(isValidVirtualHost("github.com/*/timer")).toBeTruthy()
    // Can't end with /
    expect(isValidVirtualHost("github.com/*/timer/")).toBeFalsy()
})