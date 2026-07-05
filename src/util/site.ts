/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const SEPARATORS = /[-|–_:：，]/

const INVALID_SITE_NAME = /(登录)|(我的)|(个人)|(主页)|(首页)|(Welcome)/

/**
 * Extract the site name from the title of tab
 *
 * @param title title
 * @returns siteName, undefined if disable to detect
 * @since 0.5.1
 */
export function extractSiteName(title: string): string | undefined {
    title = title.trim()
    if (!title) return undefined
    if (title.startsWith('https://') || title.startsWith('http://') || title.startsWith('ftp://')) return undefined

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
export function supportCategory(siteKey: tt4b.site.SiteKey | undefined): boolean {
    const { type } = siteKey || {}
    return type === 'normal'
}

/**
 * Marked the category ID of sites those don't set up category
 */
export const CATE_NOT_SET_ID = -1

type SiteIdentityPrefix = 'n' | 'm' | 'v'

const TYPE_PREFIX_MAP: { [type in tt4b.site.Type]: SiteIdentityPrefix } = {
    normal: "n",
    merged: "m",
    virtual: "v",
}

const PREFIX_TYPE_MAP: { [prefix in SiteIdentityPrefix]: tt4b.site.Type } = {
    n: 'normal',
    m: 'merged',
    v: 'virtual',
}

export function identifySiteKey(site: tt4b.site.SiteKey | undefined): string {
    if (!site) return ''
    const { host, type } = site || {}
    return (TYPE_PREFIX_MAP[type] ?? ' ') + (host || '')
}

export function isSameSite(a: tt4b.site.SiteKey | undefined, b: tt4b.site.SiteKey | undefined): boolean {
    return a?.host === b?.host && a?.type === b?.type
}

export function parseSiteIdentity(identity: string | undefined): tt4b.site.SiteKey | undefined {
    if (!identity) return
    const prefixMap: Record<string, tt4b.site.Type> = PREFIX_TYPE_MAP
    const type = prefixMap[identity.charAt(0)]
    if (!type) return undefined
    const host = identity.substring(1).trim()
    if (!host) return undefined
    return { type, host }
}

function cloneSiteKey(origin: tt4b.site.SiteKey | undefined): tt4b.site.SiteKey | undefined {
    if (!origin) return
    return { host: origin.host, type: origin.type }
}

export function distinctSites(list: tt4b.site.SiteKey[]): tt4b.site.SiteKey[] {
    const map: Record<string, tt4b.site.SiteKey> = {}
    list?.forEach(ele => {
        const key = identifySiteKey(ele)
        if (map[key]) return
        const cloned = cloneSiteKey(ele)
        cloned && (map[key] = cloned)
    })
    return Object.values(map)
}

export class SiteMap<T> {
    private innerMap: Record<string, [tt4b.site.SiteKey, T]>

    constructor() {
        this.innerMap = {}
    }

    static identify<T extends tt4b.site.SiteKey>(data: T[]): SiteMap<T> {
        const map = new SiteMap<T>()
        data.forEach(item => map.put(item, item))
        return map
    }

    public put(site: tt4b.site.SiteKey, t: T): void {
        const key = identifySiteKey(site)
        this.innerMap[key] = [site, t]
    }

    public get(site: tt4b.site.SiteKey): T | null {
        const key = identifySiteKey(site)
        return this.innerMap[key]?.[1] ?? null
    }

    public remove(site: tt4b.site.SiteKey): T | null {
        const key = identifySiteKey(site)
        const value = this.innerMap[key]?.[1] ?? null
        delete this.innerMap[key]
        return value
    }

    public map<R>(mapper: (key: tt4b.site.SiteKey, value: T) => R): R[] {
        return Object.values(this.innerMap).map(([site, val]) => mapper?.(site, val))
    }

    public count(): number {
        return Object.keys(this.innerMap).length
    }

    public keys(): tt4b.site.SiteKey[] {
        return Object.values(this.innerMap).map(v => v[0])
    }

    public forEach(func: (k: tt4b.site.SiteKey, v: T, idx: number) => void) {
        if (!func) return
        Object.values(this.innerMap).forEach(([k, v], idx) => func(k, v, idx))
    }
}
