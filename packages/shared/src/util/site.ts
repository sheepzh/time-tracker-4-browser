/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const SEPARATORS = /[-\|–_:：，]/

const INVALID_SITE_NAME = /(登录)|(我的)|(个人)|(主页)|(首页)|(Welcome)/

const SPECIAL_MAP: Record<string, string> = {
    // 哔哩哔哩 (゜-゜)つロ 干杯~-bilibili
    'www.bilibili.com': 'bilibili'
}

/**
 * Extract the site name from the title of tab
 *
 * @param title title
 * @returns siteName, undefined if disable to detect
 * @since 0.5.1
 */
export function extractSiteName(title: string, host?: string): string | undefined {
    title = title.trim()
    if (!title) {
        return undefined
    }
    if (host && SPECIAL_MAP[host]) {
        return SPECIAL_MAP[host]
    }
    return title
        .split(SEPARATORS)
        .filter(s => !INVALID_SITE_NAME.test(s))
        .sort((a, b) => a.length - b.length)[0]
        ?.trim?.()
}

/**
 * Generate the label text with host and name
 *
 * @since 1.1.8
 */
export function generateSiteLabel(host: string, name?: string): string {
    if (name && host !== name) {
        return `${name} (${host})`
    } else {
        return host
    }
}

/**
 * Whether to support category
 *
 * @since 3.0.0
 */
export function supportCategory(siteKey: timer.site.SiteKey | undefined): boolean {
    const { type } = siteKey || {}
    return type === 'normal'
}

export function siteEqual(a: timer.site.SiteKey | undefined, b: timer.site.SiteKey | undefined) {
    if (!a && !b) return true
    if (a === b) return true
    return a?.host === b?.host && a?.type === b?.type
}

/**
 * Marked the category ID of sites those don't set up category
 */
export const CATE_NOT_SET_ID = -1

type SiteIdentityPrefix = 'n' | 'm' | 'v'

const TYPE_PREFIX_MAP: { [type in timer.site.Type]: SiteIdentityPrefix } = {
    normal: "n",
    merged: "m",
    virtual: "v",
}

const PREFIX_TYPE_MAP: { [prefix in SiteIdentityPrefix]: timer.site.Type } = {
    n: 'normal',
    m: 'merged',
    v: 'virtual',
}

export function identifySiteKey(site: timer.site.SiteKey | undefined): string {
    if (!site) return ''
    const { host, type } = site || {}
    return (TYPE_PREFIX_MAP[type] ?? ' ') + (host || '')
}

export function parseSiteKeyFromIdentity(keyIdentity: string): timer.site.SiteKey | undefined {
    const type = PREFIX_TYPE_MAP[keyIdentity?.charAt?.(0) as SiteIdentityPrefix]
    if (!type) return
    const host = keyIdentity?.substring(1)?.trim?.()
    if (!host) return
    return { type, host }
}

function cloneSiteKey(origin: timer.site.SiteKey | undefined): timer.site.SiteKey | undefined {
    if (!origin) return
    return { host: origin.host, type: origin.type }
}

export function distinctSites(list: timer.site.SiteKey[]): timer.site.SiteKey[] {
    const map: Record<string, timer.site.SiteKey> = {}
    list?.forEach(ele => {
        const key = identifySiteKey(ele)
        if (map[key]) return
        const cloned = cloneSiteKey(ele)
        cloned && (map[key] = cloned)
    })
    return Object.values(map)
}

export class SiteMap<T> {
    private innerMap: Record<string, [timer.site.SiteKey, T | undefined]>

    constructor() {
        this.innerMap = {}
    }

    public put(site: timer.site.SiteKey, t: T | undefined): void {
        const key = identifySiteKey(site)
        this.innerMap[key] = [site, t]
    }

    public get(site: timer.site.SiteKey): T | undefined {
        const key = identifySiteKey(site)
        return this.innerMap[key]?.[1]
    }

    public map<R>(mapper: (key: timer.site.SiteKey, value: T | undefined) => R): R[] {
        return Object.values(this.innerMap).map(([site, val]) => mapper?.(site, val))
    }

    public count(): number {
        return Object.keys(this.innerMap).length
    }

    public keys(): timer.site.SiteKey[] {
        return Object.values(this.innerMap).map(v => v[0])
    }

    public forEach(func: (k: timer.site.SiteKey, v: T | undefined, idx: number) => void) {
        if (!func) return
        Object.values(this.innerMap).forEach(([k, v], idx) => func(k, v, idx))
    }
}