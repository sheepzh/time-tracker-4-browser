/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import optionHolder from "./components/option-holder"

export async function setLocale(locale: timer.option.LocaleOption): Promise<void> {
    await optionHolder.set({ locale })
}

export async function setBackupOption(option: Partial<timer.option.BackupOption>): Promise<void> {
    // Rewrite auths
    const existOption = await optionHolder.get()
    const existAuths = existOption.backupAuths || {}
    const existExts = existOption.backupExts || {}
    Object.entries(option.backupAuths || {}).forEach(([key, auth]) => existAuths[key as timer.backup.Type] = auth)
    Object.entries(option.backupExts || {}).forEach(([key, ext]) => {
        if (!ext) return
        const type = key as timer.backup.Type
        const existExt = existExts[type] || {}
        Object.entries(ext).forEach(([extKey, val]) => existExt[extKey as keyof timer.backup.TypeExt] = val)
        existExts[type] = existExt
    })
    option.backupAuths = existAuths
    option.backupExts = existExts
    await optionHolder.set(option)
}

export async function setDarkMode(mode: timer.option.DarkMode, period?: [number, number]): Promise<void> {
    const exist: timer.option.AllOption = await optionHolder.get()
    exist.darkMode = mode
    if (mode === 'timed') {
        const [start, end] = period || []
        exist.darkModeTimeStart = start
        exist.darkModeTimeEnd = end
    }
    await optionHolder.set(exist)
}
