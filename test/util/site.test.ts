/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { extractSiteName, generateSiteLabel, isSameSite, parseSiteIdentity, SiteMap } from "@util/site"

describe('site util', () => {

    test('extract site name', () => {
        expect(extractSiteName("")).toEqual(undefined)
        expect(extractSiteName("            ")).toEqual(undefined)
        expect(extractSiteName('Product Hunt – The best new products in tech.')).toEqual('Product Hunt')
        expect(extractSiteName('Product Hunt – The - best new products in tech.')).toEqual('The')

        expect(extractSiteName('Office 365 登录 | Microsoft Office')).toEqual('Microsoft Office')
        expect(extractSiteName('首页 - 知乎')).toEqual('知乎')

        expect(extractSiteName('SurveyMonkey: The World’s Most Popular Free Online Survey Tool')).toEqual('SurveyMonkey')
    })

    test('generateSiteLabel', () => {
        expect(generateSiteLabel('www.baidu.com', '百度')).toEqual('百度 (www.baidu.com)')
        expect(generateSiteLabel('www.baidu.com', '')).toEqual('www.baidu.com')
        expect(generateSiteLabel('www.baidu.com', undefined)).toEqual('www.baidu.com')
    })

    test('SiteMap', () => {
        const map = SiteMap.identify([{ type: 'normal', host: 'test.com' }])
        expect(map.remove({ type: 'normal', host: 'test.com' })).toEqual({ type: 'normal', host: 'test.com' })
        expect(map.count()).toEqual(0)
    })

    test('isSameSite', () => {
        const a: tt4b.site.SiteKey = { type: 'normal', host: 'test.com' }
        const b: tt4b.site.SiteKey = { type: 'normal', host: 'test.com' }
        const c: tt4b.site.SiteKey = { type: 'normal', host: 'test2.com' }
        expect(isSameSite(a, b)).toEqual(true)
        expect(isSameSite(undefined, a)).toEqual(false)
        expect(isSameSite(undefined, undefined)).toEqual(true)
        expect(isSameSite(a, c)).toEqual(false)
    })

    test('parseSiteIdentity', () => {
        expect(parseSiteIdentity('nwww.baidu.com')).toEqual({ type: 'normal', host: 'www.baidu.com' })
        expect(parseSiteIdentity('mwww.baidu.com')).toEqual({ type: 'merged', host: 'www.baidu.com' })
        expect(parseSiteIdentity('vwww.baidu.com')).toEqual({ type: 'virtual', host: 'www.baidu.com' })
        expect(parseSiteIdentity('xwww.baidu.com')).toEqual(undefined)
        expect(parseSiteIdentity('n')).toEqual(undefined)
        expect(parseSiteIdentity('')).toEqual(undefined)
        expect(parseSiteIdentity(undefined)).toEqual(undefined)
    })
})