/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { extractSiteName, generateSiteLabel } from "@util/site"

test('extract site name', () => {
    expect(extractSiteName("")).toEqual(undefined)
    expect(extractSiteName("            ")).toEqual(undefined)
    expect(extractSiteName('Product Hunt – The best new products in tech.')).toEqual('Product Hunt')
    expect(extractSiteName('Product Hunt – The - best new products in tech.')).toEqual('The')

    expect(extractSiteName('Office 365 登录 | Microsoft Office')).toEqual('Microsoft Office')
    expect(extractSiteName('首页 - 知乎')).toEqual('知乎')
    expect(extractSiteName('哔哩哔哩 (゜-゜)つロ 干杯~-bilibili', 'www.bilibili.com')).toEqual('bilibili')

    expect(extractSiteName('SurveyMonkey: The World’s Most Popular Free Online Survey Tool')).toEqual('SurveyMonkey')
})

test('generateSiteLabel', () => {
    expect(generateSiteLabel('www.baidu.com', '百度')).toEqual('百度 (www.baidu.com)')
    expect(generateSiteLabel('www.baidu.com', '')).toEqual('www.baidu.com')
    expect(generateSiteLabel('www.baidu.com', undefined)).toEqual('www.baidu.com')
})