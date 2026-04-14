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

initOpenLog()

/**
 * @since 0.0.4
 * @param args arguments
 */
export function log(...args: any) {
    OPEN_LOG && console.log(...args)
}
