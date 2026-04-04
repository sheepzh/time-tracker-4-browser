import CustomizedHostMergeRuler from "@service/components/host-merge-ruler"

const test0 = (host: string, expected: string) =>
    expect(new CustomizedHostMergeRuler([]).merge(host)).toEqual(expected)

const test1 = (origin: string, result: string | number, host: string, expected: string) =>
    expect(new CustomizedHostMergeRuler([{ origin, merged: result }]).merge(host)).toEqual(expected)

test('default merge', () => {
    const ip = '123.123.123.123'
    test0(ip, ip)
    const ipPort = '123.123.123.123:2222'
    test0(ipPort, ipPort)
    const likeIpButNot = '123.123.123.256'
    test0(likeIpButNot, '256')
})

test('specify merged url', () => {
    const targetUrl = '111222'
    // Matches
    test1('www.baidu.com', targetUrl, 'www.baidu.com', targetUrl)
    test1('www.*.com', targetUrl, 'www.baidu.com', targetUrl)
    test1('www.*.*', targetUrl, 'www.baidu.123', targetUrl)
    // Not match, so merged with the public suffix
    test1('www.*.*', targetUrl, 'www1.baidu.123', '123') // not any public suffix
    test1('www.baidu.com', targetUrl, 'www.baidu.com.hk', 'baidu.com.hk')
})

test('specify kept dots', () => {
    // Keep 0 dot
    test1('*.*.edu.cn', 0, 'www.hust.edu.cn', 'cn')
    // Keep 2 dots
    test1('*.*.edu.cn', 2, 'www.hust.edu.cn', 'hust.edu.cn')
    // Keep 4 dots, larger than the count of dot
    test1('*.*.edu.cn', 4, 'www.hust.edu.cn', 'www.hust.edu.cn')
})

test('specify nothing', () => {
    test1('*.*.edu.cn', '', 'www.hust.edu.cn', 'www.hust.edu.cn')
    test1('*.*.edu.cn', '', '123.hust.edu.cn', '123.hust.edu.cn')
    // Not match, so merged with the public suffix
    test1('*.*.edu.cn', '', 'xx.xx.hust.edu.cn', 'hust.edu.cn')
})