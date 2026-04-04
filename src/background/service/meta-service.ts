/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { IS_ANDROID, IS_FIREFOX } from '@/util/constant/environment'
import db from "@db/meta-database"
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
    const initial = `${getBrand()}-${Date.now()}`
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

function getBrand() {
    if (hasUaData(navigator)) {
        const { userAgentData: { brands }, platform } = navigator
        const brand = brands.map(e => e.brand)
            .filter(brand => brand && brand !== "Chromium" && !brand.includes("Not"))[0]?.replace(' ', '-')
        if (brand) return `${platform.toLowerCase()}-${brand.toLowerCase()}`
    }
    if (IS_FIREFOX) return IS_ANDROID ? 'firefox-android' : 'firefox'
    return 'unknown'
}

/**
 * @since 1.4.7
 */
export async function updateBackUpTime(type: timer.backup.Type, time: number) {
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
export async function getLastBackUp(type: timer.backup.Type): Promise<{ ts: number, msg?: string } | undefined> {
    const meta = await db.getMeta()
    return meta.backup?.[type]
}