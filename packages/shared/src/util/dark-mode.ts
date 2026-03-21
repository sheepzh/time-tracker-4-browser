/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const THEME_ATTR = "data-theme"
const DARK_VAL = "dark"
const STORAGE_KEY = "isDark"
const STORAGE_FLAG = "1"

function toggle0(isDarkMode: boolean, el?: Element) {
    el = el || document.getElementsByTagName("html")?.[0]
    el.setAttribute(THEME_ATTR, isDarkMode ? DARK_VAL : "")
    localStorage.setItem(STORAGE_KEY, isDarkMode ? STORAGE_FLAG : '')
}

/**
 * Init from local storage
 */
export function init(el?: Element) {
    const val = isDarkMode()
    toggle0(val, el)
    return val
}

function calcDarkMode(option: timer.option.AppearanceOption): boolean {
    const { darkMode, darkModeTimeStart: start, darkModeTimeEnd: end } = option
    if (darkMode === "default") {
        if (typeof window === 'undefined') return false
        return !!window.matchMedia('(prefers-color-scheme: dark)')?.matches
    } else if (darkMode === "on") {
        return true
    } else if (darkMode === "off") {
        return false
    } else if (darkMode === "timed") {
        if (start === undefined || end === undefined) {
            return false
        }
        const now = new Date()
        const currentSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
        if (start > end) {
            // Mostly
            return start <= currentSecs || currentSecs <= end
        } else if (start < end) {
            return start <= currentSecs && currentSecs <= end
        } else {
            return currentSecs === start
        }
    }
    return false
}

export function processDarkMode(option: timer.option.AppearanceOption): boolean {
    const val = calcDarkMode(option)
    toggle0(val)
    return val
}

export function isDarkMode() {
    return localStorage.getItem(STORAGE_KEY) === STORAGE_FLAG
}