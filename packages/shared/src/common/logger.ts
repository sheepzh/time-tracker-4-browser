/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const STORAGE_KEY = "_logOpen"
const STORAGE_VAL = "1"

let OPEN_LOG = false

// localStorage is not undefined in mv3 of service worker
function initOpenLog() {
    try {
        localStorage.getItem(STORAGE_KEY) === STORAGE_VAL
    } catch (ignored) { }
}

function updateLocalStorage(openState: boolean) {
    try {
        openState
            ? localStorage.setItem(STORAGE_KEY, STORAGE_VAL)
            : localStorage.removeItem(STORAGE_KEY)
    } catch (ignored) { }
}

initOpenLog()

/**
 * @since 0.0.4
 * @param args arguments
 */
export function log(...args: any) {
    OPEN_LOG && console.log(...args)
}

/**
 * @since 0.0.4
 */
export function openLog(): string {
    updateLocalStorage(OPEN_LOG = true)
    return 'Opened the log manually.'
}

/**
 * @since 0.0.8
 */
export function closeLog(): string {
    updateLocalStorage(OPEN_LOG = false)
    return 'Closed the log manually.'
}