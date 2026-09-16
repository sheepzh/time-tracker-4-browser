/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import db from "@db/meta-database"
import { IS_ANDROID, IS_CHROME, IS_EDGE, IS_FIREFOX, IS_IOS } from "@util/constant/environment"
import { truthy } from "@util/lang"
import { createArrayGuard, createObjectGuard, isString } from 'typescript-guard'

export async function getInstallTime(): Promise<number> {
    const meta = await db.getMeta()
    return meta.installTime ?? Date.now()
}

export async function updateInstallTime(ts: number) {
    const meta = await db.getMeta()
    if (meta.installTime) {
        // Must not rewrite
        return
    }
    meta.installTime = ts
    await db.update(meta)
}

/**
 * @since 1.2.0
 */
export async function getCid(): Promise<string> {
    const meta = await db.getMeta()
    const exist = meta.cid
    if (exist) return exist
    const prefix = truthy(getBrand() ?? 'unknown', getPlatform()).join('-')
    const initial = `${prefix}-${Date.now()}`
    meta.cid = initial
    await db.update(meta)
    return initial
}

// Only exists in chromium browsers
type NavigatorUAData = {
    brands: { brand: string }[]
    platform: string
}

const hasUaData = createObjectGuard<{ userAgentData: NavigatorUAData }>({
    userAgentData: createObjectGuard({
        brands: createArrayGuard(createObjectGuard({ brand: isString })),
        platform: isString,
    }),
})

const getPlatform = (): string => {
    if (IS_ANDROID) return 'android'
    if (IS_IOS) return 'ios'
    const platform = navigator.platform.toLowerCase()
    if (platform.includes('mac')) return 'macos'
    return platform
}

const getBrand = (): string | undefined => {
    if (IS_FIREFOX) return 'firefox'
    if (IS_CHROME) return 'chrome'
    if (IS_EDGE) return 'edge'
    if (hasUaData(navigator)) {
        const { userAgentData: { brands } } = navigator
        return brands.map(e => e.brand)
            .filter(brand => brand && brand !== "Chromium" && !brand.includes("Not"))[0]?.replace(' ', '-')
    }
    return undefined
}

/**
 * @since 1.4.7
 */
export async function updateBackUpTime(type: tt4b.backup.Type, time: number) {
    const meta = await db.getMeta()
    if (!meta.backup) {
        meta.backup = {}
    }
    meta.backup[type] = { ts: time }
    await db.update(meta)
}

/**
 * @since 1.4.7
 */
export async function getLastBackUp(type: tt4b.backup.Type): Promise<number | undefined> {
    const meta = await db.getMeta()
    return meta.backup?.[type]?.ts
}