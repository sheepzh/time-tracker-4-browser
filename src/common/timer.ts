/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getUsedStorage } from "@db/memory-detector"
import { closeLog, openLog } from "./logger"

/**
 * Show the memory info
 *
 * @since 0.0.9
 */
export function showMemory() {
    getUsedStorage().then(({ used, total }) => {
        console.log(`\t${used} / ${total} = ${Math.round(used * 100.0 / total * 100) / 100}%`)
    })
    return 'Memory used:'
}

export type Timer = {
    openLog: () => string
    closeLog: () => string
    showMemory: () => void
}

/**
 * @since 0.0.8
 */
const timer = {
    openLog,
    closeLog,
    showMemory
} as Timer

declare global {
    interface Window {
        timer: Timer
    }
}

/**
 * Manually open and close the log
 *
 * @since 0.0.8
 */
window.timer = timer
