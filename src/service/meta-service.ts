/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import db from "@db/meta-database"
import { REVIEW_PAGE } from "@util/constant/url"
import { getDayLength } from "@util/time"

async function getInstallTime() {
    const meta = await db.getMeta()
    return meta.installTime ? new Date(meta.installTime) : undefined
}

export async function updateInstallTime(installTime: Date) {
    const meta = await db.getMeta()
    if (meta.installTime) {
        // Must not rewrite
        return
    }
    meta.installTime = installTime.getTime()
    await db.update(meta)
}

export async function increaseApp(routePath: string) {
    const meta = await db.getMeta()
    const appCounter = meta.appCounter || {}
    appCounter[routePath] = (appCounter[routePath] || 0) + 1
    meta.appCounter = appCounter
    await db.update(meta)
}

export async function increasePopup() {
    const meta = await db.getMeta()
    const popupCounter = meta.popupCounter || {}
    popupCounter._total = (popupCounter._total || 0) + 1
    meta.popupCounter = popupCounter
    await db.update(meta)
}

/**
 * @since 1.2.0
 */
export async function getCid(): Promise<string | undefined> {
    const meta = await db.getMeta()
    return meta.cid
}

/**
 * @since 1.2.0
 */
export async function updateCid(newCid: string) {
    const meta = await db.getMeta()
    if (meta.cid) {
        return
    }
    meta.cid = newCid
    await db.update(meta)
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

/**
 * @since 2.2.0
 */
export async function saveFlag(flag: timer.ExtensionMetaFlag) {
    if (!flag) return
    const meta = await db.getMeta()
    if (!meta.flag) meta.flag = {}
    meta.flag[flag] = true
    await db.update(meta)
}

async function getFlag(flag: timer.ExtensionMetaFlag) {
    if (!flag) return false
    const meta = await db.getMeta()
    return !!meta.flag?.[flag]
}

const INSTALL_DAY_MIN_LIMIT = 14

export async function recommendRate(): Promise<boolean> {
    if (!REVIEW_PAGE) return false
    const installTime = await getInstallTime()
    if (!installTime) return false
    const installedDays = getDayLength(installTime, new Date())
    if (installedDays < INSTALL_DAY_MIN_LIMIT) return false
    const rateOpen = await getFlag("rateOpen")
    return !rateOpen
}
